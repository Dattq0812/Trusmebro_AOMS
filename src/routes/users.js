const express = require('express');
const bcrypt = require('bcryptjs');
const { truyVan } = require('../db');
const { xacThuc, choPhep } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { validateCreateUser } = require('../validators/user');
const { mapNguoiDung } = require('../utils/response');

const router = express.Router();

router.post('/', xacThuc, choPhep('QUAN_LY'), validateBody(validateCreateUser), async (req, res, next) => {
    const { email, matKhau, hoTen, sdt, vaiTro } = req.body;
    try {
        const matKhauHash = await bcrypt.hash(matKhau, 12);
        const result = await truyVan(
            `INSERT INTO nguoi_dung (email, mat_khau_hash, ho_ten, sdt, vai_tro)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, email, ho_ten, sdt, vai_tro`,
            [email.trim().toLowerCase(), matKhauHash, hoTen.trim(), sdt || null, vaiTro],
        );
        res.status(201).json({ thanhCong: true, duLieu: mapNguoiDung(result.rows[0]) });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ thanhCong: false, loi: 'Email đã được sử dụng' });
        }
        next(error);
    }
});

module.exports = router;
