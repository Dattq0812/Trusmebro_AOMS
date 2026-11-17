function isPositiveNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
}

function validateMonth(value) {
    return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function validateDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validateFee(body) {
    const errors = [];
    if (!isPositiveInteger(body.toaNhaId)) {
        errors.push({ truong: 'toaNhaId', loi: 'ID tòa nhà không hợp lệ' });
    }
    if (typeof body.ten !== 'string' || body.ten.trim().length === 0 || body.ten.length > 100) {
        errors.push({ truong: 'ten', loi: 'Tên khoản phí không hợp lệ' });
    }
    if (!['THEO_M2', 'CO_DINH', 'THEO_SO_LUONG'].includes(body.cachTinh)) {
        errors.push({ truong: 'cachTinh', loi: 'Cách tính không hợp lệ' });
    }
    if (!isPositiveNumber(body.donGia)) {
        errors.push({ truong: 'donGia', loi: 'Đơn giá phải là số dương' });
    }
    return errors;
}

function validateFeeUpdate(body) {
    const errors = [];
    if (body.ten !== undefined && (
        typeof body.ten !== 'string' || body.ten.trim().length === 0 || body.ten.length > 100
    )) {
        errors.push({ truong: 'ten', loi: 'Tên khoản phí không hợp lệ' });
    }
    if (body.cachTinh !== undefined && !['THEO_M2', 'CO_DINH', 'THEO_SO_LUONG'].includes(body.cachTinh)) {
        errors.push({ truong: 'cachTinh', loi: 'Cách tính không hợp lệ' });
    }
    if (body.donGia !== undefined && !isPositiveNumber(body.donGia)) {
        errors.push({ truong: 'donGia', loi: 'Đơn giá phải là số dương' });
    }
    if (Object.keys(body).length === 0) {
        errors.push({ truong: 'body', loi: 'Phải có ít nhất một trường cần cập nhật' });
    }
    return errors;
}

function validateIssueInvoices(body) {
    const errors = [];
    if (!validateMonth(body.thang)) {
        errors.push({ truong: 'thang', loi: 'Tháng phải có định dạng YYYY-MM' });
    }
    if (!validateDate(body.hanNop)) {
        errors.push({ truong: 'hanNop', loi: 'Hạn nộp phải có định dạng YYYY-MM-DD' });
    }
    if (body.canHoId !== undefined && !isPositiveInteger(body.canHoId)) {
        errors.push({ truong: 'canHoId', loi: 'ID căn hộ không hợp lệ' });
    }
    return errors;
}

function validatePayment(body) {
    const errors = [];
    if (!isPositiveInteger(body.hoaDonId)) {
        errors.push({ truong: 'hoaDonId', loi: 'ID hóa đơn không hợp lệ' });
    }
    if (typeof body.maGiaoDich !== 'string' || body.maGiaoDich.trim().length === 0 || body.maGiaoDich.length > 100) {
        errors.push({ truong: 'maGiaoDich', loi: 'Mã giao dịch không hợp lệ' });
    }
    if (!isPositiveNumber(body.soTien)) {
        errors.push({ truong: 'soTien', loi: 'Số tiền phải là số dương' });
    }
    if (typeof body.phuongThuc !== 'string' || body.phuongThuc.trim().length === 0 || body.phuongThuc.length > 50) {
        errors.push({ truong: 'phuongThuc', loi: 'Phương thức thanh toán không hợp lệ' });
    }
    if (body.ghiChu !== undefined && body.ghiChu !== null && (
        typeof body.ghiChu !== 'string' || body.ghiChu.length > 500
    )) {
        errors.push({ truong: 'ghiChu', loi: 'Ghi chú không hợp lệ' });
    }
    return errors;
}

function validateIdParam(paramName, message) {
    return (req, res, next) => {
        if (!isPositiveInteger(Number(req.params[paramName]))) {
            return res.status(400).json({ thanhCong: false, loi: message });
        }
        next();
    };
}

module.exports = {
    validateFee,
    validateFeeUpdate,
    validateIssueInvoices,
    validatePayment,
    validateIdParam,
};
