const express = require('express');
const cors = require('cors');
const { truyVan } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// API Kiểm tra sức khỏe hệ thống[cite: 1]
app.get('/health', (req, res) => {
    res.status(200).json({ trangThai: 'OK', thoiGian: new Date() });
});

// API thử nghiệm: Lấy danh sách căn hộ
app.get('/api/can-ho', async (req, res) => {
    try {
        const result = await truyVan('SELECT * FROM can_ho');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ loi: 'Lỗi máy chủ', chiTiet: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});