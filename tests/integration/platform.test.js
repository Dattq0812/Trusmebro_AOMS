const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../../src/index');

async function request(path, options) {
    const server = app.listen(0);
    const address = server.address();
    try {
        return await fetch(`http://127.0.0.1:${address.port}${path}`, options);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
}

test('health endpoint returns a normalized success response', async () => {
    const response = await request('/health');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.thanhCong, true);
    assert.equal(body.duLieu.trangThai, 'OK');
});

test('unknown endpoint returns a normalized error response', async () => {
    const response = await request('/not-found');
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.thanhCong, false);
    assert.equal(body.loi, 'Không tìm thấy tài nguyên');
});

test('login rejects invalid input before accessing the database', async () => {
    const response = await request('/api/auth/dang-nhap', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'invalid', matKhau: '' }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.thanhCong, false);
    assert.equal(body.loi, 'Dữ liệu không hợp lệ');
    assert.equal(body.chiTiet.length, 2);
});
