package vn.aoms.admin.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import vn.aoms.admin.R;
import vn.aoms.admin.data.ApiException;
import vn.aoms.admin.data.Session;
import vn.aoms.admin.databinding.ActivityMainBinding;

public class MainActivity extends AppCompatActivity {
    private Session session;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
        session = new Session(this);
        ActivityMainBinding binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        Ui.padSystemBars(binding.getRoot());

        setSupportActionBar(binding.toolbar);
        binding.toolbar.setSubtitle(session.hoTen());
        binding.bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_hoa_don) {
                hienThi(new InvoiceFragment(), R.string.tab_hoa_don);
            } else if (id == R.id.nav_bao_cao) {
                hienThi(new ReportFragment(), R.string.tab_bao_cao);
            } else {
                hienThi(new ApartmentsFragment(), R.string.tab_can_ho);
            }
            return true;
        });
        if (savedInstanceState == null) {
            hienThi(new ApartmentsFragment(), R.string.tab_can_ho);
        }
    }

    private void hienThi(Fragment fragment, int title) {
        setTitle(title);
        getSupportFragmentManager().beginTransaction().replace(R.id.content, fragment).commit();
    }

    /** Returns true (and sends the user back to login) when the error is an expired/invalid session. */
    boolean hetPhien(Exception error) {
        if (error instanceof ApiException && ((ApiException) error).status == 401) {
            Toast.makeText(this, "Phiên đăng nhập đã hết hạn", Toast.LENGTH_LONG).show();
            dangXuat();
            return true;
        }
        return false;
    }

    private void dangXuat() {
        session.clear();
        startActivity(new Intent(this, LoginActivity.class));
        finish();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        menu.add(Menu.NONE, R.id.action_dang_xuat, Menu.NONE, R.string.dang_xuat);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        if (item.getItemId() == R.id.action_dang_xuat) {
            dangXuat();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
