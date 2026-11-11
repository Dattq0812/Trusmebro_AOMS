package vn.aoms.admin.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;

import java.util.List;

import vn.aoms.admin.R;
import vn.aoms.admin.data.ApartmentRepository;
import vn.aoms.admin.data.ApiException;
import vn.aoms.admin.data.Async;
import vn.aoms.admin.data.Session;
import vn.aoms.admin.databinding.FragmentApartmentsBinding;
import vn.aoms.admin.model.CanHo;

public class ApartmentsFragment extends Fragment {
    private FragmentApartmentsBinding binding;
    private ApartmentRepository repository;
    private final ApartmentAdapter adapter = new ApartmentAdapter();

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle state) {
        binding = FragmentApartmentsBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle state) {
        repository = new ApartmentRepository(new Session(requireContext()));
        binding.recycler.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.recycler.setAdapter(adapter);
        binding.swipe.setOnRefreshListener(this::taiDanhSach);
        taiDanhSach();
    }

    private void taiDanhSach() {
        binding.swipe.setRefreshing(true);
        Async.run(repository::danhSach, new Async.Callback<List<CanHo>>() {
            @Override
            public void onSuccess(List<CanHo> result) {
                if (binding == null) {
                    return;
                }
                binding.swipe.setRefreshing(false);
                adapter.submitList(result);
                hienTrangThai(result.isEmpty() ? getString(R.string.chua_co_can_ho) : null);
            }

            @Override
            public void onError(Exception error) {
                if (binding == null || ((MainActivity) requireActivity()).hetPhien(error)) {
                    return;
                }
                binding.swipe.setRefreshing(false);
                // Keep any list already shown; only show the message when there is nothing to look at.
                if (adapter.getItemCount() == 0) {
                    hienTrangThai(ApiException.thongBao(error) + "\nKéo xuống để thử lại");
                }
            }
        });
    }

    private void hienTrangThai(String message) {
        binding.txtTrangThai.setText(message);
        binding.txtTrangThai.setVisibility(message == null ? View.GONE : View.VISIBLE);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
