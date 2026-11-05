function validateId(value) {
    return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function validateApartmentId(req, res, next) {
    if (!validateId(req.params.id)) {
        return res.status(400).json({
            thanhCong: false,
            loi: 'ID căn hộ không hợp lệ',
        });
    }
    next();
}

function validateResidentId(req, res, next) {
    if (!validateId(req.params.nguoiDungId)) {
        return res.status(400).json({
            thanhCong: false,
            loi: 'ID cư dân không hợp lệ',
        });
    }
    next();
}

function validateApartmentUpdate(body) {
    const errors = [];
    if (body.maCanHo !== undefined && (
        typeof body.maCanHo !== 'string' || body.maCanHo.trim().length === 0 || body.maCanHo.length > 20
    )) {
        errors.push({ truong: 'maCanHo', loi: 'Mã căn hộ không hợp lệ' });
    }
    if (body.dienTich !== undefined && (
        typeof body.dienTich !== 'number' || !Number.isFinite(body.dienTich) || body.dienTich <= 0
    )) {
        errors.push({ truong: 'dienTich', loi: 'Diện tích phải là số dương' });
    }
    if (body.toaNhaId !== undefined && !validateId(body.toaNhaId)) {
        errors.push({ truong: 'toaNhaId', loi: 'ID tòa nhà không hợp lệ' });
    }
    if (Object.keys(body).length === 0) {
        errors.push({ truong: 'body', loi: 'Phải có ít nhất một trường cần cập nhật' });
    }
    return errors;
}

function validateResidentAssignment(body) {
    const errors = [];
    if (!Number.isInteger(Number(body.nguoiDungId)) || Number(body.nguoiDungId) <= 0) {
        errors.push({ truong: 'nguoiDungId', loi: 'ID người dùng không hợp lệ' });
    }
    if (!['CHU_SO_HUU', 'NGUOI_THUE'].includes(body.vaiTroCuDan)) {
        errors.push({ truong: 'vaiTroCuDan', loi: 'Vai trò cư dân không hợp lệ' });
    }
    if (typeof body.batDau !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.batDau)) {
        errors.push({ truong: 'batDau', loi: 'Ngày bắt đầu phải có định dạng YYYY-MM-DD' });
    }
    if (body.ketThuc !== undefined && body.ketThuc !== null && (
        typeof body.ketThuc !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.ketThuc)
    )) {
        errors.push({ truong: 'ketThuc', loi: 'Ngày kết thúc phải có định dạng YYYY-MM-DD' });
    }
    if (body.ketThuc && body.batDau && body.ketThuc < body.batDau) {
        errors.push({ truong: 'ketThuc', loi: 'Ngày kết thúc không được trước ngày bắt đầu' });
    }
    return errors;
}

module.exports = {
    validateApartmentId,
    validateResidentId,
    validateApartmentUpdate,
    validateResidentAssignment,
};
