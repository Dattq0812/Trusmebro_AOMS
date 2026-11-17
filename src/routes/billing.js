const express = require('express');
const { pool, truyVan } = require('../db');
const { xacThuc, choPhep } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const {
    validateFee,
    validateFeeUpdate,
    validateIssueInvoices,
    validatePayment,
    validateIdParam,
} = require('../validators/billing');

const router = express.Router();
const feeFields = `
    kp.id, kp.toa_nha_id, t.ten AS ten_toa_nha, kp.ten, kp.cach_tinh, kp.don_gia
`;
const invoiceFields = `
    hd.id, hd.can_ho_id, c.ma_can_ho, c.toa_nha_id, t.ten AS ten_toa_nha,
    hd.thang, hd.tong_tien, hd.han_nop, hd.trang_thai
`;

function mapFee(row) {
    return {
        id: row.id,
        toaNhaId: row.toa_nha_id,
        tenToaNha: row.ten_toa_nha,
        ten: row.ten,
        cachTinh: row.cach_tinh,
        donGia: row.don_gia,
    };
}

function mapInvoice(row) {
    return {
        id: row.id,
        canHoId: row.can_ho_id,
        maCanHo: row.ma_can_ho,
        toaNhaId: row.toa_nha_id,
        tenToaNha: row.ten_toa_nha,
        thang: row.thang,
        tongTien: row.tong_tien,
        hanNop: row.han_nop,
        trangThai: row.trang_thai,
    };
}

function mapPayment(row) {
    return {
        id: row.id,
        hoaDonId: row.hoa_don_id,
        nguoiDungId: row.nguoi_dung_id,
        maGiaoDich: row.ma_giao_dich,
        soTien: row.so_tien,
        phuongThuc: row.phuong_thuc,
        trangThai: row.trang_thai,
        ghiChu: row.ghi_chu,
        taoLuc: row.tao_luc,
        capNhatLuc: row.cap_nhat_luc,
        duyetBoi: row.duyet_boi,
        duyetLuc: row.duyet_luc,
    };
}

function mapReceipt(row) {
    return {
        id: row.id,
        thanhToanId: row.thanh_toan_id,
        hoaDonId: row.hoa_don_id,
        soBienLai: row.so_bien_lai,
        soTien: row.so_tien,
        phatHanhLuc: row.phat_hanh_luc,
    };
}

async function loadInvoiceDetails(id) {
    const invoice = await truyVan(
        `SELECT ${invoiceFields}
         FROM hoa_don_phi hd
         JOIN can_ho c ON c.id = hd.can_ho_id
         JOIN toa_nha t ON t.id = c.toa_nha_id
         WHERE hd.id = $1`,
        [id],
    );
    if (invoice.rows.length === 0) {
        return null;
    }
    const details = await truyVan(
        `SELECT id, khoan_phi_id, ten_khoan, so_luong, don_gia, thanh_tien
         FROM chi_tiet_hoa_don
         WHERE hoa_don_id = $1
         ORDER BY id`,
        [id],
    );
    return {
        ...mapInvoice(invoice.rows[0]),
        chiTiet: details.rows.map((row) => ({
            id: row.id,
            khoanPhiId: row.khoan_phi_id,
            tenKhoan: row.ten_khoan,
            soLuong: row.so_luong,
            donGia: row.don_gia,
            thanhTien: row.thanh_tien,
        })),
    };
}

async function residentCanAccessInvoice(userId, invoiceId) {
    const result = await truyVan(
        `SELECT 1
         FROM hoa_don_phi hd
         JOIN cu_dan cd ON cd.can_ho_id = hd.can_ho_id
         WHERE hd.id = $1 AND cd.nguoi_dung_id = $2
           AND cd.bat_dau <= CURRENT_DATE
           AND (cd.ket_thuc IS NULL OR cd.ket_thuc >= CURRENT_DATE)`,
        [invoiceId, userId],
    );
    return result.rows.length > 0;
}

router.use(xacThuc);

router.get('/khoan-phi', async (req, res, next) => {
    try {
        const params = [];
        let where = '';
        if (req.nguoiDung.vaiTro === 'CU_DAN') {
            params.push(req.nguoiDung.id);
            where = `WHERE EXISTS (
                SELECT 1 FROM cu_dan cd
                JOIN can_ho c2 ON c2.id = cd.can_ho_id
                WHERE cd.nguoi_dung_id = $1
                  AND cd.bat_dau <= CURRENT_DATE
                  AND (cd.ket_thuc IS NULL OR cd.ket_thuc >= CURRENT_DATE)
                  AND c2.toa_nha_id = kp.toa_nha_id
            )`;
        } else if (req.nguoiDung.vaiTro !== 'QUAN_LY') {
            return res.status(403).json({ thanhCong: false, loi: 'Không có quyền thực hiện' });
        }
        const result = await truyVan(
            `SELECT ${feeFields}
             FROM khoan_phi kp
             JOIN toa_nha t ON t.id = kp.toa_nha_id
             ${where}
             ORDER BY kp.toa_nha_id, kp.id`,
            params,
        );
        res.json({ thanhCong: true, duLieu: result.rows.map(mapFee) });
    } catch (error) {
        next(error);
    }
});

router.post('/khoan-phi', choPhep('QUAN_LY'), validateBody(validateFee), async (req, res, next) => {
    try {
        const result = await truyVan(
            `INSERT INTO khoan_phi (toa_nha_id, ten, cach_tinh, don_gia)
             VALUES ($1, $2, $3, $4)
             RETURNING id, toa_nha_id, ten, cach_tinh, don_gia`,
            [req.body.toaNhaId, req.body.ten.trim(), req.body.cachTinh, req.body.donGia],
        );
        const fee = await truyVan(
            `SELECT ${feeFields}
             FROM khoan_phi kp JOIN toa_nha t ON t.id = kp.toa_nha_id
             WHERE kp.id = $1`,
            [result.rows[0].id],
        );
        res.status(201).json({ thanhCong: true, duLieu: mapFee(fee.rows[0]) });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ thanhCong: false, loi: 'Tòa nhà không tồn tại' });
        }
        next(error);
    }
});

router.patch('/khoan-phi/:id', choPhep('QUAN_LY'), validateIdParam('id', 'ID khoản phí không hợp lệ'), validateBody(validateFeeUpdate), async (req, res, next) => {
    const allowedFields = { ten: 'ten', cachTinh: 'cach_tinh', donGia: 'don_gia' };
    const fields = [];
    const values = [];
    for (const [field, column] of Object.entries(allowedFields)) {
        if (req.body[field] !== undefined) {
            values.push(typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field]);
            fields.push(`${column} = $${values.length}`);
        }
    }
    values.push(req.params.id);
    try {
        const result = await truyVan(
            `UPDATE khoan_phi SET ${fields.join(', ')}
             WHERE id = $${values.length}
             RETURNING id`,
            values,
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ thanhCong: false, loi: 'Không tìm thấy khoản phí' });
        }
        const fee = await truyVan(
            `SELECT ${feeFields}
             FROM khoan_phi kp JOIN toa_nha t ON t.id = kp.toa_nha_id
             WHERE kp.id = $1`,
            [req.params.id],
        );
        res.json({ thanhCong: true, duLieu: mapFee(fee.rows[0]) });
    } catch (error) {
        next(error);
    }
});

router.post('/hoa-don/phat-hanh', choPhep('QUAN_LY'), validateBody(validateIssueInvoices), async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const apartmentQuery = req.body.canHoId
            ? 'SELECT id, toa_nha_id, dien_tich FROM can_ho WHERE id = $1 FOR UPDATE'
            : 'SELECT id, toa_nha_id, dien_tich FROM can_ho ORDER BY id FOR UPDATE';
        const apartments = await client.query(apartmentQuery, req.body.canHoId ? [req.body.canHoId] : []);
        if (req.body.canHoId && apartments.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ thanhCong: false, loi: 'Không tìm thấy căn hộ' });
        }

        const created = [];
        for (const apartment of apartments.rows) {
            const existing = await client.query(
                'SELECT id FROM hoa_don_phi WHERE can_ho_id = $1 AND thang = $2',
                [apartment.id, req.body.thang],
            );
            if (existing.rows.length > 0) {
                continue;
            }
            const fees = await client.query(
                `SELECT id, ten, cach_tinh, don_gia
                 FROM khoan_phi
                 WHERE toa_nha_id = $1
                 ORDER BY id`,
                [apartment.toa_nha_id],
            );
            if (fees.rows.length === 0) {
                if (req.body.canHoId) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ thanhCong: false, loi: 'Tòa nhà chưa có khoản phí' });
                }
                continue;
            }
            const invoice = await client.query(
                `INSERT INTO hoa_don_phi (can_ho_id, thang, tong_tien, han_nop, trang_thai)
                 VALUES ($1, $2, 0, $3, 'CHUA_THANH_TOAN')
                 RETURNING id`,
                [apartment.id, req.body.thang, req.body.hanNop],
            );
            for (const fee of fees.rows) {
                const quantity = fee.cach_tinh === 'THEO_M2' ? apartment.dien_tich : 1;
                await client.query(
                    `INSERT INTO chi_tiet_hoa_don
                     (hoa_don_id, khoan_phi_id, ten_khoan, so_luong, don_gia, thanh_tien)
                     VALUES ($1, $2, $3, $4, $5, ROUND(($4::numeric * $5::numeric), 2))`,
                    [invoice.rows[0].id, fee.id, fee.ten, quantity, fee.don_gia],
                );
            }
            const total = await client.query(
                `UPDATE hoa_don_phi
                 SET tong_tien = (
                     SELECT COALESCE(SUM(thanh_tien), 0)
                     FROM chi_tiet_hoa_don WHERE hoa_don_id = $1
                 )
                 WHERE id = $1
                 RETURNING id, can_ho_id, thang, tong_tien, han_nop, trang_thai`,
                [invoice.rows[0].id],
            );
            created.push(total.rows[0]);
        }
        await client.query('COMMIT');
        res.status(201).json({
            thanhCong: true,
            duLieu: { soLuong: created.length, hoaDon: created },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(409).json({ thanhCong: false, loi: 'Hóa đơn của căn hộ và tháng đã tồn tại' });
        }
        next(error);
    } finally {
        client.release();
    }
});

router.get('/hoa-don', async (req, res, next) => {
    try {
        const params = [];
        let where = '';
        if (req.nguoiDung.vaiTro === 'CU_DAN') {
            params.push(req.nguoiDung.id);
            where = `WHERE EXISTS (
                SELECT 1 FROM cu_dan cd
                WHERE cd.can_ho_id = hd.can_ho_id AND cd.nguoi_dung_id = $1
                  AND cd.bat_dau <= CURRENT_DATE
                  AND (cd.ket_thuc IS NULL OR cd.ket_thuc >= CURRENT_DATE)
            )`;
        } else if (req.nguoiDung.vaiTro !== 'QUAN_LY') {
            return res.status(403).json({ thanhCong: false, loi: 'Không có quyền thực hiện' });
        }
        if (req.query.thang !== undefined) {
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(req.query.thang)) {
                return res.status(400).json({ thanhCong: false, loi: 'Tháng không hợp lệ' });
            }
            params.push(req.query.thang);
            where += `${where ? ' AND' : 'WHERE'} hd.thang = $${params.length}`;
        }
        const result = await truyVan(
            `SELECT ${invoiceFields}
             FROM hoa_don_phi hd
             JOIN can_ho c ON c.id = hd.can_ho_id
             JOIN toa_nha t ON t.id = c.toa_nha_id
             ${where}
             ORDER BY hd.thang DESC, hd.id DESC`,
            params,
        );
        res.json({ thanhCong: true, duLieu: result.rows.map(mapInvoice) });
    } catch (error) {
        next(error);
    }
});

router.get('/hoa-don/:id', validateIdParam('id', 'ID hóa đơn không hợp lệ'), async (req, res, next) => {
    try {
        const invoice = await loadInvoiceDetails(req.params.id);
        if (!invoice) {
            return res.status(404).json({ thanhCong: false, loi: 'Không tìm thấy hóa đơn' });
        }
        if (req.nguoiDung.vaiTro === 'CU_DAN' && !await residentCanAccessInvoice(req.nguoiDung.id, req.params.id)) {
            return res.status(403).json({ thanhCong: false, loi: 'Không có quyền thực hiện' });
        }
        if (!['CU_DAN', 'QUAN_LY'].includes(req.nguoiDung.vaiTro)) {
            return res.status(403).json({ thanhCong: false, loi: 'Không có quyền thực hiện' });
        }
        res.json({ thanhCong: true, duLieu: invoice });
    } catch (error) {
        next(error);
    }
});

router.post('/thanh-toan', choPhep('CU_DAN'), validateBody(validatePayment), async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const invoice = await client.query(
            `SELECT hd.id, hd.tong_tien, hd.trang_thai
             FROM hoa_don_phi hd
             JOIN cu_dan cd ON cd.can_ho_id = hd.can_ho_id
             WHERE hd.id = $1 AND cd.nguoi_dung_id = $2
               AND cd.bat_dau <= CURRENT_DATE
               AND (cd.ket_thuc IS NULL OR cd.ket_thuc >= CURRENT_DATE)
             FOR UPDATE OF hd`,
            [req.body.hoaDonId, req.nguoiDung.id],
        );
        if (invoice.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ thanhCong: false, loi: 'Không tìm thấy hóa đơn' });
        }
        if (invoice.rows[0].trang_thai === 'DA_THANH_TOAN') {
            await client.query('ROLLBACK');
            return res.status(409).json({ thanhCong: false, loi: 'Hóa đơn đã được thanh toán' });
        }
        if (Number(invoice.rows[0].tong_tien) !== req.body.soTien) {
            await client.query('ROLLBACK');
            return res.status(400).json({ thanhCong: false, loi: 'Số tiền thanh toán không khớp hóa đơn' });
        }
        const pending = await client.query(
            `SELECT 1 FROM thanh_toan
             WHERE hoa_don_id = $1 AND trang_thai = 'CHO_DUYET'
             FOR UPDATE`,
            [req.body.hoaDonId],
        );
        if (pending.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ thanhCong: false, loi: 'Hóa đơn đang có giao dịch chờ duyệt' });
        }
        const payment = await client.query(
            `INSERT INTO thanh_toan
             (hoa_don_id, nguoi_dung_id, ma_giao_dich, so_tien, phuong_thuc, ghi_chu)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                req.body.hoaDonId,
                req.nguoiDung.id,
                req.body.maGiaoDich.trim(),
                req.body.soTien,
                req.body.phuongThuc.trim(),
                req.body.ghiChu || null,
            ],
        );
        await client.query('UPDATE hoa_don_phi SET trang_thai = \'CHO_DUYET\' WHERE id = $1', [req.body.hoaDonId]);
        await client.query('COMMIT');
        res.status(201).json({ thanhCong: true, duLieu: mapPayment(payment.rows[0]) });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(409).json({ thanhCong: false, loi: 'Mã giao dịch đã tồn tại' });
        }
        next(error);
    } finally {
        client.release();
    }
});

router.get('/thanh-toan', async (req, res, next) => {
    try {
        const params = [];
        let where = '';
        if (req.nguoiDung.vaiTro === 'CU_DAN') {
            params.push(req.nguoiDung.id);
            where = 'WHERE tt.nguoi_dung_id = $1';
        } else if (req.nguoiDung.vaiTro === 'QUAN_LY') {
            if (req.query.trangThai !== undefined) {
                if (!['CHO_DUYET', 'DA_DUYET', 'TU_CHOI', 'THAT_BAI'].includes(req.query.trangThai)) {
                    return res.status(400).json({ thanhCong: false, loi: 'Trạng thái thanh toán không hợp lệ' });
                }
                params.push(req.query.trangThai);
                where = 'WHERE tt.trang_thai = $1';
            }
        } else {
            return res.status(403).json({ thanhCong: false, loi: 'Không có quyền thực hiện' });
        }
        const result = await truyVan(
            `SELECT tt.*
             FROM thanh_toan tt
             ${where}
             ORDER BY tt.tao_luc DESC`,
            params,
        );
        res.json({ thanhCong: true, duLieu: result.rows.map(mapPayment) });
    } catch (error) {
        next(error);
    }
});

async function resolvePayment(req, res, next, status) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const payment = await client.query(
            `SELECT tt.*, hd.tong_tien AS hoa_don_tong_tien, hd.trang_thai AS hoa_don_trang_thai
             FROM thanh_toan tt
             JOIN hoa_don_phi hd ON hd.id = tt.hoa_don_id
             WHERE tt.id = $1
             FOR UPDATE OF tt, hd`,
            [req.params.id],
        );
        if (payment.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ thanhCong: false, loi: 'Không tìm thấy giao dịch' });
        }
        const row = payment.rows[0];
        if (row.trang_thai !== 'CHO_DUYET') {
            await client.query('ROLLBACK');
            return res.status(409).json({ thanhCong: false, loi: 'Giao dịch không ở trạng thái chờ duyệt' });
        }
        const updated = await client.query(
            `UPDATE thanh_toan
             SET trang_thai = $1, duyet_boi = $2, duyet_luc = NOW(), cap_nhat_luc = NOW()
             WHERE id = $3
             RETURNING *`,
            [status, req.nguoiDung.id, req.params.id],
        );
        let receipt = null;
        if (status === 'DA_DUYET') {
            await client.query(
                `UPDATE hoa_don_phi
                 SET trang_thai = 'DA_THANH_TOAN'
                 WHERE id = $1`,
                [row.hoa_don_id],
            );
            const receiptResult = await client.query(
                `INSERT INTO bien_lai (thanh_toan_id, hoa_don_id, so_bien_lai, so_tien)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [
                    row.id,
                    row.hoa_don_id,
                    `BL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${row.id}`,
                    row.so_tien,
                ],
            );
            receipt = mapReceipt(receiptResult.rows[0]);
        } else {
            await client.query(
                `UPDATE hoa_don_phi
                 SET trang_thai = 'CHUA_THANH_TOAN'
                 WHERE id = $1 AND trang_thai = 'CHO_DUYET'`,
                [row.hoa_don_id],
            );
        }
        await client.query('COMMIT');
        res.json({
            thanhCong: true,
            duLieu: { thanhToan: mapPayment(updated.rows[0]), bienLai: receipt },
        });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
}

router.patch('/thanh-toan/:id/duyet', choPhep('QUAN_LY'), validateIdParam('id', 'ID giao dịch không hợp lệ'), (req, res, next) => resolvePayment(req, res, next, 'DA_DUYET'));
router.patch('/thanh-toan/:id/tu-choi', choPhep('QUAN_LY'), validateIdParam('id', 'ID giao dịch không hợp lệ'), (req, res, next) => resolvePayment(req, res, next, 'TU_CHOI'));

router.get('/hoa-don/:id/bien-lai', validateIdParam('id', 'ID hóa đơn không hợp lệ'), async (req, res, next) => {
    try {
        const result = await truyVan(
            `SELECT br.*
             FROM bien_lai br
             JOIN hoa_don_phi hd ON hd.id = br.hoa_don_id
             WHERE br.hoa_don_id = $1`,
            [req.params.id],
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ thanhCong: false, loi: 'Không tìm thấy biên lai' });
        }
        if (req.nguoiDung.vaiTro === 'CU_DAN' && !await residentCanAccessInvoice(req.nguoiDung.id, req.params.id)) {
            return res.status(403).json({ thanhCong: false, loi: 'Không có quyền thực hiện' });
        }
        res.json({ thanhCong: true, duLieu: mapReceipt(result.rows[0]) });
    } catch (error) {
        next(error);
    }
});

router.get('/cong-no', async (req, res, next) => {
    try {
        const params = [];
        let where = `WHERE hd.trang_thai <> 'DA_THANH_TOAN'`;
        if (req.nguoiDung.vaiTro === 'CU_DAN') {
            params.push(req.nguoiDung.id);
            where += ` AND EXISTS (
                SELECT 1 FROM cu_dan cd
                WHERE cd.can_ho_id = hd.can_ho_id AND cd.nguoi_dung_id = $1
                  AND cd.bat_dau <= CURRENT_DATE
                  AND (cd.ket_thuc IS NULL OR cd.ket_thuc >= CURRENT_DATE)
            )`;
        } else if (req.nguoiDung.vaiTro !== 'QUAN_LY') {
            return res.status(403).json({ thanhCong: false, loi: 'Không có quyền thực hiện' });
        }
        const result = await truyVan(
            `SELECT ${invoiceFields},
                    CASE WHEN hd.han_nop < CURRENT_DATE THEN 'QUA_HAN' ELSE hd.trang_thai END AS trang_thai_cong_no
             FROM hoa_don_phi hd
             JOIN can_ho c ON c.id = hd.can_ho_id
             JOIN toa_nha t ON t.id = c.toa_nha_id
             ${where}
             ORDER BY hd.han_nop, hd.id`,
            params,
        );
        res.json({
            thanhCong: true,
            duLieu: result.rows.map((row) => ({ ...mapInvoice(row), trangThai: row.trang_thai_cong_no })),
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
