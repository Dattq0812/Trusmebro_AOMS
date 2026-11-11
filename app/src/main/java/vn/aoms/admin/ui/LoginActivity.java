package vn.aoms.admin.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.inputmethod.EditorInfo;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;

import vn.aoms.admin.data.ApiException;
import vn.aoms.admin.data.Async;
import vn.aoms.admin.data.AuthRepository;
import vn.aoms.admin.data.Session;
import vn.aoms.admin.databinding.ActivityLoginBinding;

public class LoginActivity extends AppCompatActivity {
    private ActivityLoginBinding binding;
    private AuthRepository auth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        Session session = new Session(this);
        if (session.token() != null) {
            moManHinhChinh();
            return;
        }
        auth = new AuthRepository(session);
        binding = ActivityLoginBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        Ui.padSystemBars(binding.getRoot());

        binding.btnDangNhap.setOnClickListener(v -> dangNhap());
        binding.edtMatKhau.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                dangNhap();
                return true;
            }
            return false;
        });
    }

    private void dangNhap() {
        String email = String.valueOf(binding.edtEmail.getText()).trim();
        String matKhau = String.valueOf(binding.edtMatKhau.getText());
        if (email.isEmpty() || matKhau.isEmpty()) {
            hienLoi("Vui lòng nhập email và mật khẩu");
            return;
        }
        dangTai(true);
        Async.run(() -> {
            auth.dangNhap(email, matKhau);
            return true;
        }, new Async.Callback<Boolean>() {
            @Override
            public void onSuccess(Boolean result) {
                moManHinhChinh();
            }

            @Override
            public void onError(Exception error) {
                dangTai(false);
                hienLoi(ApiException.thongBao(error));
            }
        });
    }

    private void dangTai(boolean loading) {
        binding.btnDangNhap.setEnabled(!loading);
        binding.progress.setVisibility(loading ? View.VISIBLE : View.GONE);
        if (loading) {
            binding.txtLoi.setVisibility(View.GONE);
        }
    }

    private void hienLoi(String message) {
        binding.txtLoi.setText(message);
        binding.txtLoi.setVisibility(View.VISIBLE);
    }

    private void moManHinhChinh() {
        startActivity(new Intent(this, MainActivity.class));
        finish();
    }
}
