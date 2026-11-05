function notFoundHandler(req, res) {
    res.status(404).json({
        thanhCong: false,
        loi: 'Không tìm thấy tài nguyên',
    });
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    console.error(error);
    const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    const message = error.publicMessage
        ? error.message
        : statusCode >= 500
            ? 'Lỗi máy chủ'
            : 'Yêu cầu không hợp lệ';

    return res.status(statusCode).json({
        thanhCong: false,
        loi: message,
    });
}

module.exports = { notFoundHandler, errorHandler };
