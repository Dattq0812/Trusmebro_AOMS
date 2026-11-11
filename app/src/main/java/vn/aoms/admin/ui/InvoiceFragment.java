package vn.aoms.admin.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.material.datepicker.CalendarConstraints;
import com.google.android.material.datepicker.DateValidatorPointForward;
import com.google.android.material.datepicker.MaterialDatePicker;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.snackbar.Snackbar;

import java.math.BigDecimal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

import vn.aoms.admin.R;
import vn.aoms.admin.billing.TinhPhi;
import vn.aoms.admin.data.ApartmentRepository;
import vn.aoms.admin.data.ApiException;
import vn.aoms.admin.data.Async;
import vn.aoms.admin.data.BillingRepository;
import vn.aoms.admin.data.Session;
import vn.aoms.admin.databinding.FragmentInvoiceBinding;
import vn.aoms.admin.model.CanHo;
import vn.aoms.admin.model.KhoanPhi;

/** Close the month: pick month + due date, preview every apartment's total, then issue invoices. */
public class InvoiceFragment extends Fragment {
    private static final TimeZone UTC = TimeZone.getTimeZone("UTC");

    private FragmentInvoiceBinding binding;
    private ApartmentRepository apartments;
    private final BillingRepository billing = new BillingRepository();
    private final InvoiceLineAdapter adapter = new InvoiceLineAdapter();

    private List<CanHo> canHo = Collections.emptyList();
    private List<KhoanPhi> khoanPhi = Collections.emptyList();
    private String thang;   // yyyy-MM
    private String hanNop;  // yyyy-MM-dd

    private static final class DuLieu {
        final List<CanHo> canHo;
        final List<KhoanPhi> khoanPhi;

        DuLieu(List<CanHo> canHo, List<KhoanPhi> khoanPhi) {
            this.canHo = canHo;
            this.khoanPhi = khoanPhi;
        }
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle state) {
        binding = FragmentInvoiceBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle state) {
        apartments = new ApartmentRepository(new Session(requireContext()));
        binding.recycler.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.recycler.setAdapter(adapter);

        String[] months = thangGanDay(3);
        binding.edtThang.setSimpleItems(months);
        binding.edtThang.setText(months[0], false);
        binding.edtThang.setOnItemClickListener((parent, v, position, id) -> chonThang(months[position]));
        chonThang(months[0]);

        binding.edtHanNop.setOnClickListener(v -> chonHanNop());
        binding.btnChot.setOnClickListener(v -> xacNhan());
        binding.txtTrangThai.setOnClickListener(v -> taiDuLieu());
        taiDuLieu();
    }

    private void taiDuLieu() {
        dangTai(true);
        hienTrangThai(null);
        Async.run(() -> new DuLieu(apartments.danhSach(), billing.khoanPhi()), new Async.Callback<DuLieu>() {
            @Override
            public void onSuccess(DuLieu result) {
                if (binding == null) {
                    return;
                }
                canHo = result.canHo;
                khoanPhi = result.khoanPhi;
                binding.txtKhoanPhi.setText(moTaKhoanPhi(khoanPhi));
                adapter.setData(canHo, khoanPhi);
                capNhatTongKet();
                dangTai(false);
                hienTrangThai(canHo.isEmpty() ? getString(R.string.chua_co_can_ho) : null);
            }

            @Override
            public void onError(Exception error) {
                if (binding == null || ((MainActivity) requireActivity()).hetPhien(error)) {
                    return;
                }
                dangTai(false);
                hienTrangThai(ApiException.thongBao(error) + "\nChạm để thử lại");
            }
        });
    }

    private void xacNhan() {
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle("Chốt hóa đơn tháng " + thang + "?")
                .setMessage("Phát hành " + canHo.size() + " hóa đơn, tổng " + Ui.tien(tongTatCa())
                        + ", hạn nộp " + binding.edtHanNop.getText() + ".\nMỗi tháng chỉ chốt được một lần.")
                .setNegativeButton(R.string.huy, null)
                .setPositiveButton(R.string.chot_hoa_don, (dialog, which) -> chotHoaDon())
                .show();
    }

    private void chotHoaDon() {
        String thangChot = thang;
        List<CanHo> danhSach = canHo;
        dangTai(true);
        Async.run(() -> billing.chotHoaDon(thangChot, hanNop, danhSach), new Async.Callback<Integer>() {
            @Override
            public void onSuccess(Integer soHoaDon) {
                if (binding == null) {
                    return;
                }
                dangTai(false);
                thongBao("Đã phát hành " + soHoaDon + " hóa đơn tháng " + thangChot);
            }

            @Override
            public void onError(Exception error) {
                if (binding == null || ((MainActivity) requireActivity()).hetPhien(error)) {
                    return;
                }
                dangTai(false);
                thongBao(ApiException.thongBao(error));
            }
        });
    }

    private void chonThang(String value) {
        thang = value;
        Calendar due = batDauThangUtc(value);
        due.add(Calendar.MONTH, 1);
        due.set(Calendar.DAY_OF_MONTH, 10);
        datHanNop(due.getTimeInMillis());
    }

    private void chonHanNop() {
        CalendarConstraints constraints = new CalendarConstraints.Builder()
                .setValidator(DateValidatorPointForward.from(batDauThangUtc(thang).getTimeInMillis()))
                .build();
        MaterialDatePicker<Long> picker = MaterialDatePicker.Builder.datePicker()
                .setTitleText(R.string.han_nop)
                .setSelection(parseUtc(hanNop))
                .setCalendarConstraints(constraints)
                .build();
        picker.addOnPositiveButtonClickListener(this::datHanNop);
        picker.show(getChildFragmentManager(), "han_nop");
    }

    /** MaterialDatePicker works in UTC millis; keep every date conversion in UTC to avoid off-by-one days. */
    private void datHanNop(long utcMillis) {
        hanNop = format("yyyy-MM-dd").format(utcMillis);
        binding.edtHanNop.setText(format("dd/MM/yyyy").format(utcMillis));
    }

    private void capNhatTongKet() {
        binding.txtTongKet.setText(canHo.size() + " căn hộ · " + Ui.tien(tongTatCa()));
    }

    private BigDecimal tongTatCa() {
        BigDecimal tong = BigDecimal.ZERO;
        for (CanHo item : canHo) {
            tong = tong.add(TinhPhi.tongTien(khoanPhi, item.dienTich));
        }
        return tong;
    }

    private void dangTai(boolean loading) {
        binding.progress.setVisibility(loading ? View.VISIBLE : View.GONE);
        binding.btnChot.setEnabled(!loading && !canHo.isEmpty());
    }

    private void hienTrangThai(String message) {
        binding.txtTrangThai.setText(message);
        binding.txtTrangThai.setVisibility(message == null ? View.GONE : View.VISIBLE);
    }

    private void thongBao(String message) {
        Snackbar.make(binding.getRoot(), message, Snackbar.LENGTH_LONG).setAnchorView(binding.btnChot).show();
    }

    private static String moTaKhoanPhi(List<KhoanPhi> khoanPhi) {
        StringBuilder text = new StringBuilder("Khoản phí: ");
        for (int i = 0; i < khoanPhi.size(); i++) {
            KhoanPhi phi = khoanPhi.get(i);
            if (i > 0) {
                text.append(" · ");
            }
            text.append(phi.ten).append(' ').append(Ui.tien(phi.donGia));
            text.append(KhoanPhi.THEO_M2.equals(phi.cachTinh) ? "/m²" : "/căn");
        }
        return text.toString();
    }

    /** Current month first, then the previous ones, as yyyy-MM. */
    private static String[] thangGanDay(int count) {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM", Locale.US);
        Calendar month = Calendar.getInstance();
        String[] result = new String[count];
        for (int i = 0; i < count; i++) {
            result[i] = format.format(month.getTime());
            month.add(Calendar.MONTH, -1);
        }
        return result;
    }

    private static Calendar batDauThangUtc(String yyyyMm) {
        Calendar calendar = Calendar.getInstance(UTC);
        calendar.setTimeInMillis(parseUtc(yyyyMm + "-01"));
        return calendar;
    }

    private static long parseUtc(String yyyyMmDd) {
        try {
            return format("yyyy-MM-dd").parse(yyyyMmDd).getTime();
        } catch (ParseException e) {
            throw new IllegalArgumentException(yyyyMmDd, e);
        }
    }

    private static SimpleDateFormat format(String pattern) {
        SimpleDateFormat format = new SimpleDateFormat(pattern, Locale.US);
        format.setTimeZone(UTC);
        return format;
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
