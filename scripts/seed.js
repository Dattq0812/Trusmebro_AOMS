const { pool } = require('../src/db');

const developmentPasswordHash = '$2b$12$LMytTiWP3nQhU5kiSV9pNe/pBsco100F6lqO5evPDY2lZt6jIumEC';

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const admin = await client.query(
            `INSERT INTO nguoi_dung (email, mat_khau_hash, ho_ten, sdt, vai_tro)
             VALUES ($1, $2, $3, $4, 'QUAN_LY')
             ON CONFLICT (email) DO UPDATE
             SET ho_ten = EXCLUDED.ho_ten, sdt = EXCLUDED.sdt, vai_tro = EXCLUDED.vai_tro
             RETURNING id`,
            ['admin@example.com', developmentPasswordHash, 'Quản lý mẫu', '0900000001'],
        );
        const resident = await client.query(
            `INSERT INTO nguoi_dung (email, mat_khau_hash, ho_ten, sdt, vai_tro)
             VALUES ($1, $2, $3, $4, 'CU_DAN')
             ON CONFLICT (email) DO UPDATE
             SET ho_ten = EXCLUDED.ho_ten, sdt = EXCLUDED.sdt, vai_tro = EXCLUDED.vai_tro
             RETURNING id`,
            ['resident@example.com', developmentPasswordHash, 'Cư dân mẫu', '0900000002'],
        );
        const building = await client.query(
            `INSERT INTO toa_nha (ten, dia_chi)
             SELECT $1::varchar, $2::text
             WHERE NOT EXISTS (
                 SELECT 1 FROM toa_nha
                 WHERE ten = $1::varchar AND dia_chi = $2::text
             )
             RETURNING id`,
            ['Tòa A', '123 Đường Mẫu'],
        );
        const buildingId = building.rows[0]?.id || (
            await client.query('SELECT id FROM toa_nha WHERE ten = $1 AND dia_chi = $2', ['Tòa A', '123 Đường Mẫu'])
        ).rows[0].id;
        const apartment = await client.query(
            `INSERT INTO can_ho (toa_nha_id, ma_can_ho, dien_tich)
             VALUES ($1, $2, $3)
             ON CONFLICT (toa_nha_id, ma_can_ho) DO UPDATE SET dien_tich = EXCLUDED.dien_tich
             RETURNING id`,
            [buildingId, 'A-101', 65.5],
        );
        await client.query(
            `INSERT INTO cu_dan (nguoi_dung_id, can_ho_id, vai_tro_cu_dan, bat_dau)
             VALUES ($1, $2, 'CHU_SO_HUU', CURRENT_DATE)
             ON CONFLICT (nguoi_dung_id, can_ho_id) WHERE ket_thuc IS NULL DO NOTHING`,
            [resident.rows[0].id, apartment.rows[0].id],
        );
        await client.query(
            `INSERT INTO khoan_phi (toa_nha_id, ten, cach_tinh, don_gia)
             SELECT $1::integer, $2::varchar, $3::varchar, $4::numeric
             WHERE NOT EXISTS (
                 SELECT 1 FROM khoan_phi
                 WHERE toa_nha_id = $1::integer AND ten = $2::varchar
             )`,
            [buildingId, 'Phí quản lý', 'THEO_M2', 7000],
        );

        await client.query('COMMIT');
        console.log('Đã tạo/cập nhật dữ liệu seed phát triển.');
        console.log(`Tài khoản mẫu: admin@example.com và resident@example.com`);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch((error) => {
    console.error(`Seed thất bại: ${error.message}`);
    process.exitCode = 1;
});
