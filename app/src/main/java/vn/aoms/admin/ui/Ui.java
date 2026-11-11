package vn.aoms.admin.ui;

import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

final class Ui {
    private static final Locale VI = Locale.forLanguageTag("vi-VN");

    private Ui() {
    }

    /** Activities draw edge-to-edge; pad the root so content stays clear of status/navigation bars and the IME. */
    static void padSystemBars(View root) {
        ViewCompat.setOnApplyWindowInsetsListener(root, (view, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.ime());
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
    }

    static String tien(BigDecimal soTien) {
        return NumberFormat.getIntegerInstance(VI).format(soTien) + " đ";
    }

    static String tien(long soTien) {
        return NumberFormat.getIntegerInstance(VI).format(soTien) + " đ";
    }

    static String so(BigDecimal value) {
        NumberFormat format = NumberFormat.getNumberInstance(VI);
        format.setMaximumFractionDigits(2);
        return format.format(value);
    }
}
