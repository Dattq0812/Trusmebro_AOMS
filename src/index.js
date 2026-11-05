const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { port, allowedOrigins } = require('./config/env');
const { pool, truyVan } = require('./db');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origin không được phép'));
    },
}));
app.use(express.json({ limit: '1mb' }));

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { thanhCong: false, loi: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau' },
});

const authRoutes = require('./routes/auth');
app.use('/api/auth/dang-nhap', loginLimiter);
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({
        thanhCong: true,
        duLieu: { trangThai: 'OK', thoiGian: new Date().toISOString() },
    });
});

app.get('/api/can-ho', async (req, res, next) => {
    try {
        const result = await truyVan('SELECT * FROM can_ho');
        res.status(200).json({ thanhCong: true, duLieu: result.rows });
    } catch (error) {
        next(error);
    }
});

app.use(notFoundHandler);
app.use(errorHandler);

let server;
function startServer() {
    server = app.listen(port, () => {
        console.log(`Server đang chạy tại port ${port}`);
    });
    return server;
}

async function shutdown(signal) {
    console.log(`Nhận ${signal}, đang dừng server...`);
    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
    await pool.end();
}

if (require.main === module) {
    startServer();
    process.once('SIGINT', () => shutdown('SIGINT').then(() => process.exit(0)));
    process.once('SIGTERM', () => shutdown('SIGTERM').then(() => process.exit(0)));
}

module.exports = { app, startServer, shutdown };
