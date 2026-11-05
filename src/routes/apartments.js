const express = require('express');
const { pool, truyVan } = require('../db');
const { xacThuc, choPhep } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const {
    validateApartmentId,
    validateResidentId,
    validateApartmentUpdate,
    validateResidentAssignment,
} = require('../validators/apartment');
const { mapCanHo } = require('../utils/response');

const router = express.Router();
const apartmentSelect = `
    SELECT c.id, c.toa_nha_id, t.ten AS ten_toa_nha, t.dia_chi AS dia_chi_toa_nha,
           c.ma_can_ho, c.dien_tich
    FROM can_ho c
    JOIN toa_nha t ON t.id = c.toa_nha_id
`;
const residentSelect = `
    SELECT cd.nguoi_dung_id AS id, nd.email, nd.ho_ten, nd.sdt,
           nd.vai_tro, cd.vai_tro_cu_dan, cd.bat_dau, cd.ket_thuc
    FROM cu_dan cd
    JOIN nguoi_dung nd ON nd.id = cd.nguoi_dung_id
    WHERE cd.can_ho_id = $1
      AND cd.bat_dau <= CURRENT_DATE
      AND (cd.ket_thuc IS NULL OR cd.ket_thuc >= CURRENT_DATE)
    ORDER BY cd.bat_dau DESC
`;

async function loadApartment(id, includeResidents) {
    const apartmentResult = await truyVan(`${apartmentSelect} WHERE c.id = $1`, [id]);
    if (apartmentResult.rows.length === 0) {
        return null;
    }
    const apartment = apartmentResult.rows[0];
    if (includeResidents) {
        const residents = await truyVan(residentSelect, [id]);
        apartment.cu_dan = residents.rows.map((resident) => ({
            id: resident.id,
            email: resident.email,
            hoTen: resident.ho_ten,
            sdt: resident.sdt,
            vaiTro: resident.vai_tro,
            vaiTroCuDan: resident.vai_tro_cu_dan,
            batDau: resident.bat_dau,
            ketThuc: resident.ket_thuc,
        }));
    }
    return mapCanHo(apartment);
}

router.use(xacThuc);

router.get('/', async (req, res, next) => {
    try {
        const params = [];
        let where = '';
        if (req.nguoiDung.vaiTro === 'CU_DAN') {
            params.push(req.nguoiDung.id);
            where = `WHERE EXISTS (
                SELECT 1 FROM cu_dan cd
                WHERE cd.can_ho_id = c.id
                  AND cd.nguoi_dung_id = $1
                  AND cd.bat_dau <= CURRENT_DATE
                  AND (cd.ket_thuc IS NULL OR cd.ket_thuc >= CURRENT_DATE)
            )`;
        } else if (req.nguoiDung.vaiTro !== 'QUAN_LY') {
            return res.status(403).json({ thanhCong: false, loi: 'Không có quyền thực hiện' });
        }
        const result = await truyVan(`${apartmentSelect} ${where} ORDER BY c.id`, params);
        const apartments = result.rows.map((row) => mapCanHo(row));
        res.json({ thanhCong: true, duLieu: apartments });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', validateApartmentId, async (req, res, next) => {
    try {
        const apartment = await loadApartment(req.params.id, true);
        if (!apartment) {
            return res.status(404).json({ thanhCong: false, loi: 'Không tìm thấy căn hộ' });
        }
        if (req.nguoiDung.vaiTro === 'CU_DAN' && !apartment.cuDan.some(
            (resident) => resident.id === req.nguoiDung.id,
        )) {
            return res.status(403).json({ thanhCong: false, loi: 'Không có quyền thực hiện' });
        }
        if (req.nguoiDung.vaiTro !== 'QUAN_LY' && req.nguoiDung.vaiTro !== 'CU_DAN') {
            return res.status(403).json({ thanhCong: false, loi: 'Không có quyền thực hiện' });
        }
        res.json({ thanhCong: true, duLieu: apartment });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', choPhep('QUAN_LY'), validateApartmentId, validateBody(validateApartmentUpdate), async (req, res, next) => {
    const fields = [];
    const values = [];
    const allowedFields = { toaNhaId: 'toa_nha_id', maCanHo: 'ma_can_ho', dienTich: 'dien_tich' };
    for (const [field, column] of Object.entries(allowedFields)) {
        if (req.body[field] !== undefined) {
            values.push(req.body[field]);
            fields.push(`${column} = $${values.length}`);
        }
    }
    values.push(req.params.id);
    try {
        const result = await truyVan(
            `UPDATE can_ho SET ${fields.join(', ')} WHERE id = $${values.length}
             RETURNING id, toa_nha_id, ma_can_ho, dien_tich`,
            values,
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ thanhCong: false, loi: 'Không tìm thấy căn hộ' });
        }
        const apartment = await loadApartment(req.params.id, true);
        res.json({ thanhCong: true, duLieu: apartment });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ thanhCong: false, loi: 'Mã căn hộ đã tồn tại trong tòa nhà' });
        }
        if (error.code === '23503') {
            return res.status(400).json({ thanhCong: false, loi: 'Tòa nhà không tồn tại' });
        }
        next(error);
    }
});

router.post('/:id/cu-dan', choPhep('QUAN_LY'), validateApartmentId, validateBody(validateResidentAssignment), async (req, res, next) => {
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        const apartment = await client.query('SELECT id FROM can_ho WHERE id = $1 FOR UPDATE', [req.params.id]);
        if (apartment.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ thanhCong: false, loi: 'Không tìm thấy căn hộ' });
        }
        const user = await client.query(
            `SELECT id, email, ho_ten, sdt, vai_tro FROM nguoi_dung WHERE id = $1 FOR SHARE`,
            [req.body.nguoiDungId],
        );
        if (user.rows.length === 0 || user.rows[0].vai_tro !== 'CU_DAN') {
            await client.query('ROLLBACK');
            return res.status(400).json({ thanhCong: false, loi: 'Người dùng không phải cư dân hợp lệ' });
        }
        const relation = await client.query(
            `SELECT id FROM cu_dan
             WHERE nguoi_dung_id = $1 AND can_ho_id = $2
               AND (ket_thuc IS NULL OR ket_thuc >= $3::date)
             FOR UPDATE`,
            [req.body.nguoiDungId, req.params.id, req.body.batDau],
        );
        if (relation.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ thanhCong: false, loi: 'Quan hệ cư dân với căn hộ đã tồn tại' });
        }
        const created = await client.query(
            `INSERT INTO cu_dan (nguoi_dung_id, can_ho_id, vai_tro_cu_dan, bat_dau, ket_thuc)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, nguoi_dung_id, can_ho_id, vai_tro_cu_dan, bat_dau, ket_thuc`,
            [
                req.body.nguoiDungId,
                req.params.id,
                req.body.vaiTroCuDan,
                req.body.batDau,
                req.body.ketThuc || null,
            ],
        );
        await client.query('COMMIT');
        res.status(201).json({
            thanhCong: true,
            duLieu: {
                id: created.rows[0].id,
                nguoiDungId: created.rows[0].nguoi_dung_id,
                canHoId: created.rows[0].can_ho_id,
                vaiTroCuDan: created.rows[0].vai_tro_cu_dan,
                batDau: created.rows[0].bat_dau,
                ketThuc: created.rows[0].ket_thuc,
            },
        });
    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        if (error.code === '23505') {
            return res.status(409).json({ thanhCong: false, loi: 'Quan hệ cư dân đang bị trùng' });
        }
        next(error);
    } finally {
        if (client) {
            client.release();
        }
    }
});

router.delete('/:id/cu-dan/:nguoiDungId', choPhep('QUAN_LY'), validateApartmentId, validateResidentId, async (req, res, next) => {
    try {
        const result = await truyVan(
            `UPDATE cu_dan SET ket_thuc = CURRENT_DATE
             WHERE can_ho_id = $1 AND nguoi_dung_id = $2
               AND ket_thuc IS NULL
             RETURNING id`,
            [req.params.id, req.params.nguoiDungId],
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ thanhCong: false, loi: 'Không tìm thấy quan hệ cư dân đang hoạt động' });
        }
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

module.exports = router;
