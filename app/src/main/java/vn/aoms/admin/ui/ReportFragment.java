package vn.aoms.admin.ui;

import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.PieChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.data.PieData;
import com.github.mikephil.charting.data.PieDataSet;
import com.github.mikephil.charting.data.PieEntry;
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter;
import com.github.mikephil.charting.formatter.PercentFormatter;
import com.google.android.material.color.MaterialColors;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import vn.aoms.admin.R;
import vn.aoms.admin.data.ApiException;
import vn.aoms.admin.data.Async;
import vn.aoms.admin.data.ReportRepository;
import vn.aoms.admin.databinding.FragmentReportBinding;

public class ReportFragment extends Fragment {
    private FragmentReportBinding binding;
    private final ReportRepository repository = new ReportRepository();

    private static final class DuLieu {
        final List<ReportRepository.DoanhThuThang> doanhThu;
        final ReportRepository.CongNo congNo;

        DuLieu(List<ReportRepository.DoanhThuThang> doanhThu, ReportRepository.CongNo congNo) {
            this.doanhThu = doanhThu;
            this.congNo = congNo;
        }
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle state) {
        binding = FragmentReportBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle state) {
        binding.txtLoi.setOnClickListener(v -> taiDuLieu());
        taiDuLieu();
    }

    private void taiDuLieu() {
        binding.progress.setVisibility(View.VISIBLE);
        binding.txtLoi.setVisibility(View.GONE);
        Async.run(() -> new DuLieu(repository.doanhThu6Thang(), repository.congNoThangNay()),
                new Async.Callback<DuLieu>() {
                    @Override
                    public void onSuccess(DuLieu result) {
                        if (binding == null) {
                            return;
                        }
                        binding.progress.setVisibility(View.GONE);
                        veDoanhThu(binding.chartDoanhThu, result.doanhThu);
                        veCongNo(binding.chartCongNo, result.congNo);
                    }

                    @Override
                    public void onError(Exception error) {
                        if (binding == null || ((MainActivity) requireActivity()).hetPhien(error)) {
                            return;
                        }
                        binding.progress.setVisibility(View.GONE);
                        binding.txtLoi.setText(ApiException.thongBao(error) + "\nChạm để thử lại");
                        binding.txtLoi.setVisibility(View.VISIBLE);
                    }
                });
    }

    private void veDoanhThu(BarChart chart, List<ReportRepository.DoanhThuThang> doanhThu) {
        int textColor = mauChu();
        List<BarEntry> entries = new ArrayList<>();
        List<String> labels = new ArrayList<>();
        for (int i = 0; i < doanhThu.size(); i++) {
            entries.add(new BarEntry(i, doanhThu.get(i).soTien / 1_000_000f));
            labels.add(doanhThu.get(i).thang);
        }
        BarDataSet dataSet = new BarDataSet(entries, getString(R.string.doanh_thu_6_thang));
        dataSet.setColor(ContextCompat.getColor(requireContext(), R.color.brand));
        dataSet.setValueTextColor(textColor);
        dataSet.setValueTextSize(11f);
        BarData data = new BarData(dataSet);
        data.setBarWidth(0.6f);

        XAxis xAxis = chart.getXAxis();
        xAxis.setValueFormatter(new IndexAxisValueFormatter(labels));
        xAxis.setGranularity(1f);
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setTextColor(textColor);
        chart.getAxisLeft().setAxisMinimum(0f);
        chart.getAxisLeft().setTextColor(textColor);
        chart.getAxisRight().setEnabled(false);
        chart.getDescription().setEnabled(false);
        chart.getLegend().setEnabled(false);
        chart.setContentDescription(getString(R.string.doanh_thu_6_thang));
        chart.setData(data);
        chart.setFitBars(true);
        chart.animateY(600);
        chart.invalidate();
    }

    private void veCongNo(PieChart chart, ReportRepository.CongNo congNo) {
        int textColor = mauChu();
        long tong = congNo.daThu + congNo.conNo;
        float tyLeDaThu = tong == 0 ? 0 : congNo.daThu * 100f / tong;
        binding.txtCongNo.setText("Đã thu " + Ui.tien(congNo.daThu) + " · Còn nợ " + Ui.tien(congNo.conNo));

        PieDataSet dataSet = new PieDataSet(Arrays.asList(
                new PieEntry(congNo.daThu, "Đã thu"),
                new PieEntry(congNo.conNo, "Còn nợ")), "");
        dataSet.setColors(ContextCompat.getColor(requireContext(), R.color.brand), Color.parseColor("#D9534F"));
        dataSet.setSliceSpace(2f);
        dataSet.setValueTextColor(Color.WHITE);
        dataSet.setValueTextSize(12f);
        PieData data = new PieData(dataSet);
        data.setValueFormatter(new PercentFormatter(chart));

        chart.setUsePercentValues(true);
        chart.setDrawEntryLabels(false);
        chart.setHoleColor(Color.TRANSPARENT);
        chart.setCenterText(String.format(java.util.Locale.US, "%.0f%%\nđã thu", tyLeDaThu));
        chart.setCenterTextColor(textColor);
        chart.setCenterTextSize(16f);
        chart.getDescription().setEnabled(false);
        chart.getLegend().setTextColor(textColor);
        chart.setContentDescription(binding.txtCongNo.getText());
        chart.setData(data);
        chart.animateY(600);
        chart.invalidate();
    }

    /** MPAndroidChart draws black text by default; follow the theme so dark mode stays readable. */
    private int mauChu() {
        return MaterialColors.getColor(binding.getRoot(), com.google.android.material.R.attr.colorOnSurface);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
