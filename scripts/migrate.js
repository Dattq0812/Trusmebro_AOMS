const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../src/db');

const migrationsDirectory = path.join(__dirname, '..', 'database', 'migrations');

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        const files = fs.readdirSync(migrationsDirectory)
            .filter((file) => /^\d+_.+\.sql$/.test(file))
            .sort();
        const appliedResult = await client.query('SELECT version FROM schema_migrations');
        const applied = new Set(appliedResult.rows.map((row) => row.version));

        for (const file of files) {
            if (applied.has(file)) {
                continue;
            }
            const sql = fs.readFileSync(path.join(migrationsDirectory, file), 'utf8');
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
                await client.query('COMMIT');
                console.log(`Đã chạy migration ${file}`);
            } catch (error) {
                await client.query('ROLLBACK');
                throw new Error(`Migration ${file} thất bại: ${error.message}`, { cause: error });
            }
        }
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
