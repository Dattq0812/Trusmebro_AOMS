# Kế hoạch hoàn thiện Backend AOMS

## 1. Trạng thái hiện tại

- [x] Khởi tạo Node.js backend.
- [x] Cấu hình Express, CORS, dotenv và PostgreSQL.
- [x] Kết nối database đã được sửa và sẵn sàng kiểm thử lại.
- [x] Đăng nhập bằng email/mật khẩu.
- [x] Hash và kiểm tra mật khẩu bằng `bcryptjs`.
- [x] Phát hành JWT.
- [x] Middleware xác thực JWT.
- [x] Middleware phân quyền theo vai trò.
- [x] API kiểm tra sức khỏe `/health`.
- [ ] Hoàn thiện các API nghiệp vụ theo use case.
- [ ] Bổ sung migration, seed data, validation và test.

## 2. Nguyên tắc triển khai

1. Hoàn thành từng phase theo thứ tự, không mở rộng phase tiếp theo khi phase trước chưa có test cơ bản.
2. Mọi API nghiệp vụ phải dùng JWT và kiểm tra quyền ở server.
3. Mọi câu lệnh SQL phải dùng query parameter, không nối chuỗi dữ liệu từ request.
4. Các nghiệp vụ thay đổi nhiều bảng phải dùng transaction PostgreSQL.
5. Không trả `error.message`, SQL hoặc thông tin nhạy cảm ra client ở production.
6. Mỗi API mới cần có validation, status code và trường hợp lỗi rõ ràng.
7. Không commit `.env`, mật khẩu, JWT secret hoặc dữ liệu thật.

## 3. Cấu trúc backend mục tiêu

```text
src/
├── config/
│   └── env.js
├── controllers/
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── validate.js
├── repositories/
├── routes/
├── services/
├── validators/
├── db.js
└── index.js

database/
├── migrations/
└── seeds/

tests/
├── integration/
└── unit/
```

## 4. Phase 1 - Củng cố nền tảng [Hoàn thành]

**Mục tiêu:** backend có cấu trúc ổn định trước khi thêm nghiệp vụ.

### Công việc

- [x] Tạo module kiểm tra biến môi trường bắt buộc: `DATABASE_URL`, `JWT_SECRET`, `PORT`.
- [x] Tách xử lý lỗi thành middleware dùng chung.
- [x] Chuẩn hóa response lỗi và response thành công.
- [x] Thêm validation request body/query/params.
- [x] Giới hạn CORS theo origin của Flutter app và môi trường phát triển.
- [x] Thêm graceful shutdown cho HTTP server và PostgreSQL pool.
- [x] Thêm timeout và xử lý lỗi kết nối database.
- [x] Thêm `helmet`, rate limit cho đăng nhập và giới hạn kích thước JSON nếu phù hợp.
- [x] Bổ sung script `dev`, `start` và `test` trong `package.json`.
- [x] Tạo `.env.example` không chứa giá trị thật.

### Tiêu chí hoàn thành

- Server không khởi động nếu thiếu biến môi trường bắt buộc.
- Lỗi không làm lộ SQL, password hoặc stack trace.
- API trả status code nhất quán.
- Có thể chạy backend bằng `npm run dev` và `npm start`.

## 5. Phase 2 - Xác thực và quản lý căn hộ [Hoàn thành]

**Use case:** UC-01, UC-05, UC-06.

### API

```text
POST /api/auth/dang-nhap
GET  /api/me
GET  /api/can-ho
GET  /api/can-ho/:id
POST /api/can-ho/:id/cu-dan
DELETE /api/can-ho/:id/cu-dan/:nguoiDungId
```

### Công việc

- [x] Validate email và mật khẩu khi đăng nhập.
- [x] Thêm API tạo/quản lý người dùng cho Admin để vận hành việc gắn cư dân.
- [x] Bảo vệ `/api/can-ho` bằng `xacThuc`.
- [x] Admin xem và cập nhật toàn bộ căn hộ.
- [x] Cư dân chỉ xem căn hộ mà mình đang được gắn.
- [x] Kiểm tra thời hạn quan hệ cư dân - căn hộ.
- [x] Không trả `mat_khau_hash` trong bất kỳ response nào.
- [x] Thêm ràng buộc vai trò và quan hệ cư dân trong database.

### Tiêu chí hoàn thành

- Đăng nhập đúng trả JWT; sai trả `401` với thông báo chung.
- Request không có JWT trả `401`.
- Sai vai trò trả `403`.
- Cư dân không thể xem hoặc sửa dữ liệu căn hộ khác.
- Admin có thể gắn và hủy gắn cư dân hợp lệ.

## 6. Phase 3 - Phí, hóa đơn và công nợ

**Use case:** UC-08, UC-09, UC-10, UC-11, UC-12.

### Bổ sung database

```text
thanh_toan
bien_lai
```

Nên bổ sung thêm:

- Unique `(can_ho_id, thang)` cho hóa đơn.
- Trạng thái hóa đơn: `CHUA_THANH_TOAN`, `CHO_DUYET`, `DA_THANH_TOAN`, `QUA_HAN`.
- Trạng thái thanh toán: `CHO_DUYET`, `DA_DUYET`, `TU_CHOI`, `THAT_BAI`.
- Mã giao dịch duy nhất từ cổng thanh toán.
- Thời gian tạo, cập nhật và duyệt.

### API

```text
GET   /api/khoan-phi
POST  /api/khoan-phi
PATCH /api/khoan-phi/:id

POST  /api/hoa-don/phat-hanh
GET   /api/hoa-don
GET   /api/hoa-don/:id

POST  /api/thanh-toan
GET   /api/thanh-toan
PATCH /api/thanh-toan/:id/duyet
PATCH /api/thanh-toan/:id/tu-choi
GET   /api/hoa-don/:id/bien-lai
GET   /api/cong-no
```

### Luồng bắt buộc

1. Admin cấu hình khoản phí.
2. Hệ thống phát hành hóa đơn theo tháng.
3. Hệ thống tính tiền theo diện tích hoặc loại khoản phí.
4. Cư dân xem chi tiết hóa đơn.
5. Cư dân tạo yêu cầu thanh toán.
6. Giao dịch được ghi nhận ở trạng thái chờ duyệt.
7. Admin duyệt hoặc từ chối giao dịch.
8. Khi duyệt, cập nhật hóa đơn và phát hành biên lai.

### Tiêu chí hoàn thành

- Phát hành hóa đơn không tạo bản ghi trùng cho cùng căn hộ và tháng.
- Tổng hóa đơn bằng tổng các dòng chi tiết.
- Duyệt thanh toán cập nhật hóa đơn và biên lai trong cùng transaction.
- Cư dân chỉ xem hóa đơn của căn hộ mình.
- Admin xem được danh sách công nợ và giao dịch cần duyệt.

## 7. Phase 4 - Quản lý sự cố

**Use case:** UC-14, UC-15, UC-16, UC-17, UC-18.

### Bổ sung database

```text
su_co
phan_cong_su_co
lich_su_su_co
danh_gia_su_co
```

Trạng thái đề xuất:

```text
MOI
DA_TIEP_NHAN
DANG_XU_LY
DA_HOAN_TAT
DA_DONG
```

### API

```text
POST  /api/su-co
GET   /api/su-co
GET   /api/su-co/:id
PATCH /api/su-co/:id/tiep-nhan
PATCH /api/su-co/:id/phan-cong
PATCH /api/su-co/:id/trang-thai
POST  /api/su-co/:id/danh-gia
```

### Quy tắc

- Cư dân tạo và theo dõi sự cố của mình.
- Admin tiếp nhận và phân công nhân viên kỹ thuật.
- Nhân viên kỹ thuật cập nhật tiến độ.
- Mọi thay đổi trạng thái phải được lưu lịch sử.
- Chỉ cho đánh giá khi sự cố đã hoàn tất.
- Không cho sửa hoặc đánh giá sự cố của người khác.

## 8. Phase 5 - Tiện ích và dịch vụ

**Use case:** UC-21, UC-22, UC-23, UC-24.

### Bổ sung database

```text
tien_ich
khung_gio_tien_ich
dat_tien_ich
dang_ky_thang_may
khach_tham
dang_ky_dich_vu
```

### API

```text
GET   /api/tien-ich
POST  /api/tien-ich
POST  /api/tien-ich/:id/dat-cho
DELETE /api/dat-tien-ich/:id

POST  /api/thang-may/dang-ky
GET   /api/thang-may/dang-ky

POST  /api/khach-tham
GET   /api/khach-tham

GET   /api/dang-ky-dich-vu
PATCH /api/dang-ky-dich-vu/:id/duyet
PATCH /api/dang-ky-dich-vu/:id/tu-choi
```

### Tiêu chí hoàn thành

- Không thể đặt trùng khung giờ nếu vượt sức chứa.
- Việc kiểm tra sức chứa và tạo lượt đặt dùng transaction.
- Cư dân chỉ quản lý đăng ký của mình.
- Admin duyệt hoặc từ chối đăng ký dịch vụ.
- Khách thăm có thời gian hiệu lực rõ ràng.

## 9. Phase 6 - Thông báo và báo cáo

**Use case:** UC-25, UC-26, UC-27.

### Bổ sung database

```text
thong_bao
thong_bao_nguoi_nhan
```

### API

```text
POST  /api/thong-bao
GET   /api/thong-bao
PATCH /api/thong-bao/:id/da-doc

GET   /api/bao-cao/doanh-thu
GET   /api/bao-cao/cong-no
GET   /api/bao-cao/su-co
GET   /api/bao-cao/dich-vu
```

### Tiêu chí hoàn thành

- Admin đăng thông báo chung.
- Cư dân chỉ nhận thông báo phù hợp với quyền và căn hộ.
- Có trạng thái đã đọc/chưa đọc.
- Báo cáo hỗ trợ lọc theo tháng và tòa nhà.
- Các truy vấn báo cáo có index và phân trang khi cần.

## 10. Migration và dữ liệu mẫu

- [ ] Đổi `schema.sql` thành migration có version.
- [ ] Tạo migration riêng cho từng nhóm bảng nghiệp vụ.
- [ ] Thêm seed Admin, cư dân, tòa nhà, căn hộ và khoản phí mẫu.
- [ ] Không lưu mật khẩu dạng plain text trong seed.
- [ ] Thêm script chạy migration/seed có thể lặp lại an toàn.
- [ ] Ghi rõ cách reset database trong tài liệu phát triển.

## 11. Kiểm thử bắt buộc

### Unit test

- [ ] Tính tiền theo diện tích.
- [ ] Kiểm tra vai trò.
- [ ] Kiểm tra trạng thái hóa đơn.
- [ ] Kiểm tra chuyển trạng thái sự cố.
- [ ] Kiểm tra sức chứa tiện ích.

### Integration test

- [ ] Đăng nhập thành công/thất bại.
- [ ] Truy cập API không có token.
- [ ] Truy cập sai vai trò.
- [ ] Cư dân truy cập dữ liệu căn hộ khác.
- [ ] Phát hành hóa đơn bị trùng.
- [ ] Duyệt thanh toán cập nhật đúng nhiều bảng.
- [ ] Đánh giá sự cố chưa hoàn tất.
- [ ] Đặt tiện ích vượt sức chứa.

### Kiểm tra vận hành

- [ ] `GET /health` trả trạng thái server.
- [ ] Health check báo lỗi database khi database không truy cập được.
- [ ] Không có secret trong log.
- [ ] `npm test` chạy được từ thư mục `backend`.
- [ ] Có collection Postman hoặc tài liệu Swagger cho toàn bộ API.

## 12. Thứ tự thực hiện đề xuất

1. Hoàn thành Phase 1: nền tảng, lỗi và validation.
2. Hoàn thành Phase 2: xác thực, người dùng và căn hộ.
3. Hoàn thành migration/seed tối thiểu.
4. Hoàn thành Phase 3: hóa đơn, thanh toán và công nợ.
5. Hoàn thành Phase 4: sự cố.
6. Hoàn thành Phase 5: tiện ích và dịch vụ.
7. Hoàn thành Phase 6: thông báo và báo cáo.
8. Bổ sung test, tài liệu API và kiểm tra end-to-end.

Mỗi phase nên được commit riêng trên nhánh `backend`, với format commit đề xuất:

```text
feat(auth): complete apartment access APIs
feat(billing): add invoice and payment workflow
feat(incidents): add incident assignment and tracking
feat(services): add facility booking APIs
test(api): add integration coverage
```
