package vn.aoms.admin.model;

import java.math.BigDecimal;

/** Mirrors table khoan_phi; cachTinh is THEO_M2, CO_DINH or THEO_SO_LUONG. */
public final class KhoanPhi {
    public static final String THEO_M2 = "THEO_M2";
    public static final String CO_DINH = "CO_DINH";
    public static final String THEO_SO_LUONG = "THEO_SO_LUONG";

    public final int id;
    public final String ten;
    public final String cachTinh;
    public final BigDecimal donGia;

    public KhoanPhi(int id, String ten, String cachTinh, BigDecimal donGia) {
        this.id = id;
        this.ten = ten;
        this.cachTinh = cachTinh;
        this.donGia = donGia;
    }
}
