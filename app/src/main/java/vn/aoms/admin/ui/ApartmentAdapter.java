package vn.aoms.admin.ui;

import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import vn.aoms.admin.databinding.ItemApartmentBinding;
import vn.aoms.admin.model.CanHo;

final class ApartmentAdapter extends ListAdapter<CanHo, ApartmentAdapter.Holder> {
    private static final DiffUtil.ItemCallback<CanHo> DIFF = new DiffUtil.ItemCallback<CanHo>() {
        @Override
        public boolean areItemsTheSame(@NonNull CanHo a, @NonNull CanHo b) {
            return a.id == b.id;
        }

        @Override
        public boolean areContentsTheSame(@NonNull CanHo a, @NonNull CanHo b) {
            return a.maCanHo.equals(b.maCanHo)
                    && a.tenToaNha.equals(b.tenToaNha)
                    && a.dienTich.compareTo(b.dienTich) == 0;
        }
    };

    ApartmentAdapter() {
        super(DIFF);
    }

    @NonNull
    @Override
    public Holder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return new Holder(ItemApartmentBinding.inflate(LayoutInflater.from(parent.getContext()), parent, false));
    }

    @Override
    public void onBindViewHolder(@NonNull Holder holder, int position) {
        CanHo canHo = getItem(position);
        holder.binding.txtMaCanHo.setText(canHo.maCanHo);
        holder.binding.txtToaNha.setText(canHo.tenToaNha);
        holder.binding.txtDienTich.setText(Ui.so(canHo.dienTich) + " m²");
    }

    static final class Holder extends RecyclerView.ViewHolder {
        final ItemApartmentBinding binding;

        Holder(ItemApartmentBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }
    }
}
