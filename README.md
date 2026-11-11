# AOMS Admin (Android, Java)

App cho ban quản lý (`vaiTro = QUAN_LY`), dùng chung backend ở nhánh `backend`.

| Màn hình | Dữ liệu |
|---|---|
| Đăng nhập | API thật `POST /api/auth/dang-nhap` (chỉ cho tài khoản `QUAN_LY`) |
| Căn hộ (RecyclerView, kéo để tải lại) | API thật `GET /api/can-ho` |
| Chốt hóa đơn (chọn tháng, hạn nộp, xem trước tiền từng căn, chốt) | Căn hộ: API thật. Khoản phí và phát hành: **mock** trong `BillingRepository` |
| Báo cáo (biểu đồ cột doanh thu 6 tháng, biểu đồ tròn công nợ) | **Mock** trong `ReportRepository` |

Khi backend có Phase 3/6 (`/api/khoan-phi`, `/api/hoa-don/phat-hanh`, `/api/bao-cao/*`), chỉ cần thay thân hàm trong
`BillingRepository` và `ReportRepository` bằng lời gọi `ApiClient`; giao diện không cần sửa.

## Chạy

- Android Studio (JDK 17+), mở thư mục này.
- Backend chạy ở cổng 3000. Mặc định app gọi `http://10.0.2.2:3000` (Android Emulator).
- Máy thật cùng mạng LAN:

```bash
./gradlew installDebug -PapiBaseUrl=http://<IP_MAY_CHAY_BACKEND>:3000
```

Bản debug cho phép `http`; bản release chỉ cho `https`.

## Kiểm thử

```bash
./gradlew testDebugUnitTest
```

`TinhPhiTest` kiểm tra cách tính tiền: theo m², cố định, làm tròn từng dòng đến đồng, tổng bằng tổng các dòng.

## Cấu trúc

```text
app/src/main/java/vn/aoms/admin/
├── billing/TinhPhi.java        # tính tiền hóa đơn (BigDecimal)
├── data/                       # ApiClient, Session (JWT mã hóa bằng Android Keystore), repositories
├── model/                      # CanHo, KhoanPhi
└── ui/                         # Login, Main (bottom nav), 3 fragment + adapter
```
