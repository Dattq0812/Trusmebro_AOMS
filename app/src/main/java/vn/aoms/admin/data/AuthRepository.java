package vn.aoms.admin.data;

import org.json.JSONObject;

/** POST /api/auth/dang-nhap; only QUAN_LY accounts may use the admin app. */
public final class AuthRepository {
    private final ApiClient api;
    private final Session session;

    public AuthRepository(Session session) {
        this.session = session;
        this.api = new ApiClient(session);
    }

    public void dangNhap(String email, String matKhau) throws Exception {
        JSONObject body = new JSONObject().put("email", email).put("matKhau", matKhau);
        JSONObject result = api.post("/api/auth/dang-nhap", body);
        JSONObject nguoiDung = result.getJSONObject("nguoiDung");
        // UX gate only: the backend still enforces roles on every admin endpoint.
        if (!"QUAN_LY".equals(nguoiDung.getString("vaiTro"))) {
            throw new ApiException(403, "Tài khoản không có quyền quản lý");
        }
        session.save(result.getString("token"), nguoiDung.getString("hoTen"));
    }
}
