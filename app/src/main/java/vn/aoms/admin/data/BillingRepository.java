package vn.aoms.admin.data;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import vn.aoms.admin.model.CanHo;
import vn.aoms.admin.model.KhoanPhi;

/**
 * Fee config and invoice issuing.
 * ponytail: mock until backend Phase 3 ships GET /api/khoan-phi and POST /api/hoa-don/phat-hanh;
 * then replace both method bodies with ApiClient calls (keep the signatures, the UI needs no change).
 */
public final class BillingRepository {
    // Months already closed in this app process; the real backend enforces UNIQUE (can_ho_id, thang).
    private static final Set<String> THANG_DA_CHOT = new HashSet<>();

    public List<KhoanPhi> khoanPhi() throws Exception {
        Thread.sleep(300);
        return Arrays.asList(
                new KhoanPhi(1, "Phí quản lý", KhoanPhi.THEO_M2, new BigDecimal("7000")),
                new KhoanPhi(2, "Phí vệ sinh", KhoanPhi.CO_DINH, new BigDecimal("50000")),
                new KhoanPhi(3, "Phí bảo trì", KhoanPhi.THEO_M2, new BigDecimal("1500")));
    }

    /** Issues one invoice per apartment for {@code thang} (yyyy-MM); returns how many were created. */
    public int chotHoaDon(String thang, String hanNop, List<CanHo> canHo) throws Exception {
        Thread.sleep(500);
        synchronized (THANG_DA_CHOT) {
            if (!THANG_DA_CHOT.add(thang)) {
                throw new ApiException(409, "Hóa đơn tháng " + thang + " đã được chốt trước đó");
            }
        }
        return canHo.size();
    }
}
