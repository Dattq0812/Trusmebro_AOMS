package vn.aoms.admin.billing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import vn.aoms.admin.model.KhoanPhi;

/** Invoice preview math. Each line is rounded to whole đồng, so the total always equals the sum of its lines. */
public final class TinhPhi {
    private TinhPhi() {
    }

    public static BigDecimal thanhTien(KhoanPhi phi, BigDecimal dienTich) {
        switch (phi.cachTinh) {
            case KhoanPhi.THEO_M2:
                return phi.donGia.multiply(dienTich).setScale(0, RoundingMode.HALF_UP);
            case KhoanPhi.CO_DINH:
                return phi.donGia.setScale(0, RoundingMode.HALF_UP);
            default:
                // THEO_SO_LUONG needs a per-apartment quantity the backend does not store yet.
                return BigDecimal.ZERO;
        }
    }

    public static BigDecimal tongTien(List<KhoanPhi> khoanPhi, BigDecimal dienTich) {
        BigDecimal tong = BigDecimal.ZERO;
        for (KhoanPhi phi : khoanPhi) {
            tong = tong.add(thanhTien(phi, dienTich));
        }
        return tong;
    }
}
