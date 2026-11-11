package vn.aoms.admin.data;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

/**
 * Report data for the charts.
 * ponytail: mock until backend Phase 6 ships GET /api/bao-cao/doanh-thu and /api/bao-cao/cong-no;
 * then replace the method bodies with ApiClient calls.
 */
public final class ReportRepository {
    public static final class DoanhThuThang {
        public final String thang;
        public final long soTien;

        DoanhThuThang(String thang, long soTien) {
            this.thang = thang;
            this.soTien = soTien;
        }
    }

    public static final class CongNo {
        public final long daThu;
        public final long conNo;

        CongNo(long daThu, long conNo) {
            this.daThu = daThu;
            this.conNo = conNo;
        }
    }

    private static final long[] MAU_DOANH_THU = {182_500_000, 176_300_000, 190_100_000, 185_800_000, 201_400_000, 168_900_000};

    /** Last 6 months, oldest first, labelled MM/yyyy. */
    public List<DoanhThuThang> doanhThu6Thang() throws Exception {
        Thread.sleep(300);
        SimpleDateFormat format = new SimpleDateFormat("MM/yyyy", Locale.US);
        Calendar month = Calendar.getInstance();
        month.add(Calendar.MONTH, -5);
        List<DoanhThuThang> result = new ArrayList<>();
        for (long soTien : MAU_DOANH_THU) {
            result.add(new DoanhThuThang(format.format(month.getTime()), soTien));
            month.add(Calendar.MONTH, 1);
        }
        return result;
    }

    public CongNo congNoThangNay() throws Exception {
        Thread.sleep(300);
        return new CongNo(168_900_000, 42_350_000);
    }
}
