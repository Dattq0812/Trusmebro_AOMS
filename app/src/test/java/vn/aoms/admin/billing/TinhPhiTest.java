package vn.aoms.admin.billing;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import vn.aoms.admin.model.KhoanPhi;

public class TinhPhiTest {
    private static final KhoanPhi QUAN_LY = new KhoanPhi(1, "Phí quản lý", KhoanPhi.THEO_M2, new BigDecimal("7000"));
    private static final KhoanPhi VE_SINH = new KhoanPhi(2, "Phí vệ sinh", KhoanPhi.CO_DINH, new BigDecimal("50000"));
    private static final KhoanPhi GUI_XE = new KhoanPhi(3, "Gửi xe", KhoanPhi.THEO_SO_LUONG, new BigDecimal("120000"));

    @Test
    public void theoM2NhanDienTich() {
        assertEquals(new BigDecimal("528500"), TinhPhi.thanhTien(QUAN_LY, new BigDecimal("75.50")));
    }

    @Test
    public void coDinhKhongPhuThuocDienTich() {
        assertEquals(new BigDecimal("50000"), TinhPhi.thanhTien(VE_SINH, new BigDecimal("120")));
    }

    @Test
    public void lamTronTungDongDenDong() {
        KhoanPhi le = new KhoanPhi(4, "Lẻ", KhoanPhi.THEO_M2, new BigDecimal("7333"));
        // 62.35 * 7333 = 457212.55 -> 457213
        assertEquals(new BigDecimal("457213"), TinhPhi.thanhTien(le, new BigDecimal("62.35")));
    }

    @Test
    public void tongBangTongCacDong() {
        List<KhoanPhi> phi = Arrays.asList(QUAN_LY, VE_SINH, GUI_XE);
        BigDecimal dienTich = new BigDecimal("75.50");
        // THEO_SO_LUONG contributes 0 until the backend stores quantities.
        assertEquals(new BigDecimal("578500"), TinhPhi.tongTien(phi, dienTich));
    }
}
