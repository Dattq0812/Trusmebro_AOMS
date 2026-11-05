-- 1. Bảng người dùng chung (cho xác thực)
CREATE TABLE nguoi_dung (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    mat_khau_hash VARCHAR(255) NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    sdt VARCHAR(20),
    vai_tro VARCHAR(20) NOT NULL CHECK (vai_tro IN ('QUAN_LY', 'CU_DAN'))
);

-- 2. Bảng Tòa nhà
CREATE TABLE toa_nha (
    id SERIAL PRIMARY KEY,
    ten VARCHAR(100) NOT NULL,
    dia_chi TEXT
);

-- 3. Bảng Căn hộ (chứa thông tin diện tích để tính phí theo m2)
CREATE TABLE can_ho (
    id SERIAL PRIMARY KEY,
    toa_nha_id INT NOT NULL REFERENCES toa_nha(id) ON DELETE CASCADE,
    ma_can_ho VARCHAR(20) NOT NULL,
    dien_tich NUMERIC(10, 2) NOT NULL CHECK (dien_tich > 0),
    UNIQUE(toa_nha_id, ma_can_ho)
);

-- 4. Bảng Cư dân (Map người dùng vào căn hộ)
CREATE TABLE cu_dan (
    id SERIAL PRIMARY KEY,
    nguoi_dung_id INT REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    can_ho_id INT REFERENCES can_ho(id) ON DELETE CASCADE,
    vai_tro_cu_dan VARCHAR(50) NOT NULL CHECK (vai_tro_cu_dan IN ('CHU_SO_HUU', 'NGUOI_THUE')),
    bat_dau DATE NOT NULL,
    ket_thuc DATE,
    CHECK (ket_thuc IS NULL OR ket_thuc >= bat_dau)
);

-- 5. Bảng Khoản phí (Cấu hình biểu giá)
CREATE TABLE khoan_phi (
    id SERIAL PRIMARY KEY,
    toa_nha_id INT REFERENCES toa_nha(id) ON DELETE CASCADE,
    ten VARCHAR(100) NOT NULL,
    cach_tinh VARCHAR(50) NOT NULL, -- 'THEO_M2', 'CO_DINH', 'THEO_SO_LUONG'
    don_gia NUMERIC(15, 2) NOT NULL
);

-- 6. Bảng Hóa đơn phí
CREATE TABLE hoa_don_phi (
    id SERIAL PRIMARY KEY,
    can_ho_id INT REFERENCES can_ho(id) ON DELETE CASCADE,
    thang VARCHAR(7) NOT NULL, -- Định dạng YYYY-MM
    tong_tien NUMERIC(15, 2) DEFAULT 0,
    han_nop DATE NOT NULL,
    trang_thai VARCHAR(50) DEFAULT 'CHUA_THANH_TOAN' -- 'CHUA_THANH_TOAN', 'DA_THANH_TOAN'
);

-- 7. Bảng Chi tiết Hóa đơn
CREATE TABLE chi_tiet_hoa_don (
    id SERIAL PRIMARY KEY,
    hoa_don_id INT REFERENCES hoa_don_phi(id) ON DELETE CASCADE,
    khoan_phi_id INT REFERENCES khoan_phi(id) ON DELETE CASCADE,
    ten_khoan VARCHAR(100) NOT NULL,
    so_luong NUMERIC(10, 2) NOT NULL,
    don_gia NUMERIC(15, 2) NOT NULL,
    thanh_tien NUMERIC(15, 2) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cu_dan_quan_he_dang_hieu_luc
    ON cu_dan (nguoi_dung_id, can_ho_id)
    WHERE ket_thuc IS NULL;

CREATE INDEX IF NOT EXISTS idx_cu_dan_nguoi_dung_hieu_luc
    ON cu_dan (nguoi_dung_id, can_ho_id, bat_dau, ket_thuc);