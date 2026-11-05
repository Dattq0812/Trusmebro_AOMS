function validateBody(schema) {
    return (req, res, next) => {
        const errors = schema(req.body || {});
        if (errors.length > 0) {
            return res.status(400).json({
                thanhCong: false,
                loi: 'Dữ liệu không hợp lệ',
                chiTiet: errors,
            });
        }

        next();
    };
}

function validateLogin(body) {
    const errors = [];
    if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
        errors.push({ truong: 'email', loi: 'Email không hợp lệ' });
    }
    if (typeof body.matKhau !== 'string' || body.matKhau.length === 0) {
        errors.push({ truong: 'matKhau', loi: 'Mật khẩu không được để trống' });
    }
    return errors;
}

module.exports = { validateBody, validateLogin };
