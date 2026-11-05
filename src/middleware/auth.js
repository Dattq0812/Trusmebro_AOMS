const jwt = require('jsonwebtoken');

// Middleware 1: Kiểm tra người dùng đã đăng nhập (có token) chưa
function xacThuc(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ thanhCong: false, loi: 'Thiếu token' });
    }
    
    try {
        req.nguoiDung = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ thanhCong: false, loi: 'Token không hợp lệ hoặc đã hết hạn' });
    }
}

// Middleware 2: Kiểm tra vai trò (Admin hay Cư dân)
function choPhep(...vaiTroChoPhep) {
    return (req, res, next) => {
        if (!vaiTroChoPhep.includes(req.nguoiDung.vaiTro)) {
            return res.status(403).json({ thanhCong: false, loi: 'Không có quyền thực hiện' });
        }
        next();
    };
}

module.exports = { xacThuc, choPhep };