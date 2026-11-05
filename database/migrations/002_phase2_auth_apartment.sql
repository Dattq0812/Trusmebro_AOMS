DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_nguoi_dung_vai_tro'
    ) THEN
        ALTER TABLE nguoi_dung
            ADD CONSTRAINT chk_nguoi_dung_vai_tro
            CHECK (vai_tro IN ('QUAN_LY', 'CU_DAN'));
    END IF;
END $$;

ALTER TABLE can_ho
    ALTER COLUMN toa_nha_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_can_ho_dien_tich'
    ) THEN
        ALTER TABLE can_ho
            ADD CONSTRAINT chk_can_ho_dien_tich CHECK (dien_tich > 0);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_cu_dan_vai_tro'
    ) THEN
        ALTER TABLE cu_dan
            ADD CONSTRAINT chk_cu_dan_vai_tro
            CHECK (vai_tro_cu_dan IN ('CHU_SO_HUU', 'NGUOI_THUE'));
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_cu_dan_ngay'
    ) THEN
        ALTER TABLE cu_dan
            ADD CONSTRAINT chk_cu_dan_ngay
            CHECK (ket_thuc IS NULL OR ket_thuc >= bat_dau);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_cu_dan_quan_he_dang_hieu_luc
    ON cu_dan (nguoi_dung_id, can_ho_id)
    WHERE ket_thuc IS NULL;

CREATE INDEX IF NOT EXISTS idx_cu_dan_nguoi_dung_hieu_luc
    ON cu_dan (nguoi_dung_id, can_ho_id, bat_dau, ket_thuc);
