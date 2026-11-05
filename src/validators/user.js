function validateCreateUser(body) {
    const errors = [];
    if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
        errors.push({ truong: 'email', loi: 'Email không hợp lệ' });
    }
    if (typeof body.matKhau !== 'string' || body.matKhau.length < 8) {
        errors.push({ truong: 'matKhau', loi: 'Mật khẩu phải có ít nhất 8 ký tự' });
    }
    if (typeof body.hoTen !== 'string' || body.hoTen.trim().length === 0 || body.hoTen.length > 100) {
        errors.push({ truong: 'hoTen', loi: 'Họ tên không hợp lệ' });
    }
    if (body.sdt !== undefined && (typeof body.sdt !== 'string' || body.sdt.length > 20)) {
        errors.push({ truong: 'sdt', loi: 'Số điện thoại không hợp lệ' });
    }
    if (!['QUAN_LY', 'CU_DAN'].includes(body.vaiTro)) {
        errors.push({ truong: 'vaiTro', loi: 'Vai trò không hợp lệ' });
    }
    return errors;
}

module.exports = { validateCreateUser };
