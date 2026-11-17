ALTER TABLE hoa_don_phi
    ADD CONSTRAINT uq_hoa_don_phi_can_ho_thang UNIQUE (can_ho_id, thang);

ALTER TABLE hoa_don_phi
    ALTER COLUMN can_ho_id SET NOT NULL,
    ALTER COLUMN tong_tien SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_hoa_don_phi_trang_thai'
    ) THEN
        ALTER TABLE hoa_don_phi
            ADD CONSTRAINT chk_hoa_don_phi_trang_thai
            CHECK (trang_thai IN ('CHUA_THANH_TOAN', 'CHO_DUYET', 'DA_THANH_TOAN', 'QUA_HAN'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS thanh_toan (
    id SERIAL PRIMARY KEY,
    hoa_don_id INT NOT NULL REFERENCES hoa_don_phi(id) ON DELETE CASCADE,
    nguoi_dung_id INT NOT NULL REFERENCES nguoi_dung(id) ON DELETE RESTRICT,
    ma_giao_dich VARCHAR(100) NOT NULL UNIQUE,
    so_tien NUMERIC(15, 2) NOT NULL CHECK (so_tien > 0),
    phuong_thuc VARCHAR(50) NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CHO_DUYET'
        CHECK (trang_thai IN ('CHO_DUYET', 'DA_DUYET', 'TU_CHOI', 'THAT_BAI')),
    ghi_chu TEXT,
    tao_luc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cap_nhat_luc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duyet_boi INT REFERENCES nguoi_dung(id) ON DELETE SET NULL,
    duyet_luc TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bien_lai (
    id SERIAL PRIMARY KEY,
    thanh_toan_id INT NOT NULL UNIQUE REFERENCES thanh_toan(id) ON DELETE RESTRICT,
    hoa_don_id INT NOT NULL REFERENCES hoa_don_phi(id) ON DELETE RESTRICT,
    so_bien_lai VARCHAR(100) NOT NULL UNIQUE,
    so_tien NUMERIC(15, 2) NOT NULL CHECK (so_tien > 0),
    phat_hanh_luc TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hoa_don_phi_can_ho_thang
    ON hoa_don_phi (can_ho_id, thang);

CREATE INDEX IF NOT EXISTS idx_thanh_toan_trang_thai
    ON thanh_toan (trang_thai, tao_luc);

CREATE INDEX IF NOT EXISTS idx_thanh_toan_hoa_don
    ON thanh_toan (hoa_don_id, trang_thai);

CREATE INDEX IF NOT EXISTS idx_bien_lai_hoa_don
    ON bien_lai (hoa_don_id);
