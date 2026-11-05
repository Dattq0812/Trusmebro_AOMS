const dotenv = require('dotenv');

dotenv.config();

const requiredVariables = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${missingVariables.join(', ')}`);
}

if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET phải có ít nhất 32 ký tự');
}

const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT phải là số nguyên trong khoảng 1-65535');
}

module.exports = {
    port,
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    nodeEnv: process.env.NODE_ENV || 'development',
};
