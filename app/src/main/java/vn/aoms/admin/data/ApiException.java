package vn.aoms.admin.data;

import java.io.IOException;

/** HTTP error from the backend; message is the backend's {@code loi} field. */
public class ApiException extends Exception {
    public final int status;

    public ApiException(int status, String message) {
        super(message);
        this.status = status;
    }

    /** User-facing message for any error thrown by the data layer. */
    public static String thongBao(Exception e) {
        if (e instanceof ApiException) {
            return e.getMessage();
        }
        if (e instanceof IOException) {
            return "Không kết nối được máy chủ";
        }
        return "Đã có lỗi xảy ra";
    }
}
