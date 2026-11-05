
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { truyVan } = require('../db');

const router = express.Router();

router.post('/dang-nhap', async (req, res) => {
    const { email, matKhau } = req.body;
    
    try {
        // Tìm user trong Database
        const r = await truyVan('SELECT * FROM nguoi_dung WHERE email = $1', [email]);
        const u = r.rows[0];
        
        // Kiểm tra mật khẩu (thông báo chung chung để tránh lộ email có tồn tại hay không)[cite: 1]
        if (!u || !(await bcrypt.compare(matKhau, u.mat_khau_hash))) {
            return res.status(401).json({ loi: 'Email hoặc mật khẩu không đúng' });
        }
        
        // Tạo JWT Token có thời hạn 7 ngày[cite: 1]
        const token = jwt.sign(
            { id: u.id, vaiTro: u.vai_tro }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );
        
        // Trả về token và thông tin cơ bản
        res.json({ 
            token, 
            nguoiDung: { 
                id: u.id, 
                hoTen: u.ho_ten, 
                vaiTro: u.vai_tro 
            } 
        });
    } catch (error) {
        res.status(500).json({ loi: 'Lỗi máy chủ', chiTiet: error.message });
    }
});

module.exports = router;