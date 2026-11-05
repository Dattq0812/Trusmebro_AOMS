# AOMS - Apartment Operations Management System

Hệ thống quản lý vận hành chung cư, gồm:

- **Backend:** Node.js, Express, PostgreSQL và JWT.
- **Android Admin:** ứng dụng cho ban quản lý.
- **Flutter Client:** ứng dụng cho cư dân.
- **Database:** PostgreSQL, dùng `schema.sql` làm schema khởi đầu.

Các use case chính được mô tả trong [usecase.puml](./usecase.puml), gồm xác thực, quản lý căn hộ, phí và hóa đơn, sự cố, tiện ích, thông báo và báo cáo.

## Cấu trúc dự án

```text
AOMS/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── db.js
│   │   └── index.js
│   ├── database/
│   ├── tests/
│   ├── schema.sql
│   ├── .env.example
│   └── package.json
├── Trusmebro_AOMS/       # Flutter Client
├── android-admin/        # Android Admin, khi checkout nhánh tương ứng
└── usecase.puml
```

## Trạng thái hiện tại

Nền tảng backend đã hoàn thành:

- Kiểm tra `DATABASE_URL`, `JWT_SECRET` và `PORT`.
- Đăng nhập bằng email/mật khẩu và phát hành JWT.
- Middleware xác thực JWT và phân quyền theo vai trò.
- `GET /health`.
- Validation dữ liệu đăng nhập.
- Response lỗi/thành công được chuẩn hóa.
- CORS allowlist, Helmet, rate limit đăng nhập và giới hạn JSON.
- Timeout PostgreSQL và graceful shutdown.
- Test tích hợp nền tảng.

Các API nghiệp vụ còn lại sẽ được triển khai theo [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md). Client không nên tự suy đoán response cho các endpoint chưa có route thực tế.

## Yêu cầu môi trường

- Node.js 18 trở lên.
- npm.
- PostgreSQL hoặc Supabase PostgreSQL.
- Flutter SDK 3.13 trở lên cho `Trusmebro_AOMS`.
- Android Studio/SDK nếu chạy nhánh `android-admin`.

## Chạy backend local

### 1. Cài dependency

```powershell
cd backend
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` từ [.env.example](./backend/.env.example):

```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/aoms
JWT_SECRET=thay-bang-chuoi-bi-mat-it-nhat-32-ky-tu
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
```

Không commit `.env`, mật khẩu database, JWT secret hoặc dữ liệu thật.

### 3. Khởi tạo database

Tạo database `aoms`, sau đó chạy schema:

```powershell
psql "$env:DATABASE_URL" -f schema.sql
```

Với Supabase, có thể mở SQL Editor và chạy nội dung [backend/schema.sql](./backend/schema.sql).

### 4. Khởi động

```powershell
# Development, tự reload khi sửa file
npm run dev

# Production/local run
npm start
```

Kiểm tra server:

```powershell
curl http://localhost:3000/health
```

Response thành công có dạng:

```json
{
  "thanhCong": true,
  "duLieu": {
    "trangThai": "OK",
    "thoiGian": "2026-01-01T00:00:00.000Z"
  }
}
```

## Quy ước gọi API

### Base URL

Chọn base URL theo môi trường chạy client:

| Môi trường | Base URL |
|---|---|
| Flutter Web trên cùng máy | `http://localhost:3000` |
| Android Emulator | `http://10.0.2.2:3000` |
| iOS Simulator | `http://127.0.0.1:3000` |
| Thiết bị thật cùng mạng LAN | `http://<IP_MAY_CHAY_BACKEND>:3000` |
| Production | `https://api.<domain-cua-du-an>` |

Không dùng `localhost` trong Android Emulator vì nó trỏ tới chính emulator, không phải máy phát triển.

### Header

Request JSON:

```http
Content-Type: application/json
```

Các API yêu cầu đăng nhập dùng:

```http
Authorization: Bearer <JWT_TOKEN>
```

Token nhận được từ API đăng nhập phải được lưu trong secure storage của client, không lưu hard-code trong source.

### Đăng nhập

```http
POST /api/auth/dang-nhap
Content-Type: application/json
```

Body:

```json
{
  "email": "resident@example.com",
  "matKhau": "password"
}
```

Đăng nhập thành công:

```json
{
  "thanhCong": true,
  "token": "<jwt>",
  "nguoiDung": {
    "id": 1,
    "hoTen": "Nguyen Van A",
    "vaiTro": "CU_DAN"
  }
}
```

Đăng nhập thất bại trả HTTP `401` với thông báo chung. Dữ liệu không hợp lệ trả HTTP `400`.

### Quy ước lỗi

Client nên xử lý tối thiểu các status code:

| Status | Ý nghĩa |
|---:|---|
| `400` | Body/query/params không hợp lệ |
| `401` | Thiếu hoặc sai JWT; email/mật khẩu không đúng |
| `403` | Không đủ quyền |
| `404` | Không tìm thấy route hoặc tài nguyên |
| `429` | Vượt giới hạn đăng nhập |
| `500` | Lỗi máy chủ; không hiển thị chi tiết nội bộ cho người dùng |

Response lỗi có dạng:

```json
{
  "thanhCong": false,
  "loi": "Thông báo lỗi dành cho client",
  "chiTiet": []
}
```

## Tích hợp nhánh `android-admin`

Nhánh Android Admin dùng cùng backend và chịu trách nhiệm cho các thao tác quản trị:

- Đăng nhập với tài khoản có `vaiTro = QUAN_LY`.
- Quản lý căn hộ và cư dân.
- Cấu hình khoản phí, phát hành hóa đơn.
- Duyệt/từ chối thanh toán.
- Tiếp nhận và phân công sự cố.
- Duyệt đăng ký dịch vụ.
- Đăng thông báo và xem báo cáo.

Quy trình tích hợp:

1. Checkout nhánh `android-admin`.
2. Cấu hình `BASE_URL` theo bảng môi trường ở trên.
3. Tạo một lớp `ApiClient` dùng chung để thêm `Content-Type` và JWT.
4. Tạo repository theo từng nhóm API: `auth`, `apartments`, `billing`, `incidents`, `services`, `notifications`.
5. Chặn màn hình quản trị nếu JWT không có vai trò `QUAN_LY`; việc kiểm tra này chỉ phục vụ UX, backend vẫn là nơi quyết định quyền.
6. Khi nhận `401`, xóa token và đưa người dùng về màn hình đăng nhập.

Ví dụ request:

```http
GET /api/can-ho
Authorization: Bearer <admin-jwt>
```

## Tích hợp `Flutter Client`

Thư mục Flutter hiện tại là [Trusmebro_AOMS](./Trusmebro_AOMS). Nhánh client dùng cho cư dân:

- Đăng nhập với tài khoản có `vaiTro = CU_DAN`.
- Xem căn hộ được gắn.
- Xem hóa đơn và công nợ.
- Tạo yêu cầu thanh toán.
- Gửi và theo dõi sự cố.
- Đặt tiện ích, đăng ký thang máy, khai báo khách thăm.
- Xem thông báo và đánh giá sự cố đã hoàn tất.

Nên tổ chức lớp gọi API theo cấu trúc:

```text
lib/
├── core/
│   ├── config/api_config.dart
│   ├── network/api_client.dart
│   └── storage/token_storage.dart
├── features/
│   ├── auth/data/auth_api.dart
│   ├── apartments/data/apartment_api.dart
│   ├── billing/data/billing_api.dart
│   ├── incidents/data/incident_api.dart
│   └── services/data/service_api.dart
└── main.dart
```

Ví dụ cấu hình base URL:

```dart
const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3000',
);
```

Chạy Flutter:

```powershell
cd Trusmebro_AOMS
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

`ApiClient` nên:

1. Gắn `Authorization: Bearer <token>` cho request cần xác thực.
2. Encode body bằng JSON.
3. Kiểm tra HTTP status trước khi decode dữ liệu nghiệp vụ.
4. Chuyển `401` thành trạng thái đăng xuất.
5. Hiển thị lỗi `400`, `403`, `404` và `429` bằng thông báo thân thiện.
6. Có timeout và trạng thái mất mạng.

## API theo giai đoạn

Các route dưới đây là hợp đồng mục tiêu trong kế hoạch; chỉ tích hợp sau khi backend đã triển khai và có test tương ứng.

### Xác thực và căn hộ

```text
POST   /api/auth/dang-nhap
GET    /api/me
GET    /api/can-ho
GET    /api/can-ho/:id
POST   /api/can-ho/:id/cu-dan
DELETE /api/can-ho/:id/cu-dan/:nguoiDungId
```

### Phí, hóa đơn và thanh toán

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

### Sự cố

```text
POST  /api/su-co
GET   /api/su-co
GET   /api/su-co/:id
PATCH /api/su-co/:id/tiep-nhan
PATCH /api/su-co/:id/phan-cong
PATCH /api/su-co/:id/trang-thai
POST  /api/su-co/:id/danh-gia
```

### Tiện ích, thông báo và báo cáo

```text
GET    /api/tien-ich
POST   /api/tien-ich/:id/dat-cho
DELETE /api/dat-tien-ich/:id
POST   /api/thang-may/dang-ky
POST   /api/khach-tham
GET    /api/khach-tham
GET    /api/thong-bao
PATCH  /api/thong-bao/:id/da-doc
GET    /api/bao-cao/doanh-thu
GET    /api/bao-cao/cong-no
GET    /api/bao-cao/su-co
GET    /api/bao-cao/dich-vu
```

## Kiểm thử backend

```powershell
cd backend
npm test
```

Trước khi mở rộng client, cần đảm bảo backend có test cho:

- Đăng nhập thành công/thất bại.
- Truy cập không có token.
- Sai vai trò.
- Phân quyền theo căn hộ.
- Tính hóa đơn và chống phát hành trùng.
- Transaction khi duyệt thanh toán.
- Chuyển trạng thái sự cố và giới hạn đánh giá.
- Kiểm tra sức chứa tiện ích.

## Quy tắc phát triển

- Mọi SQL dùng query parameter, không nối chuỗi dữ liệu từ request.
- Mọi API nghiệp vụ phải xác thực JWT và kiểm tra quyền ở server.
- Nghiệp vụ thay đổi nhiều bảng phải dùng PostgreSQL transaction.
- Không trả `mat_khau_hash`, SQL, stack trace hoặc secret cho client.
- Mỗi API mới cần validation, status code, test và cập nhật tài liệu.
- Tách commit theo phase; tham khảo [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).
