package vn.aoms.admin.ui;

import android.annotation.SuppressLint;
import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.Collections;
import java.util.List;

import vn.aoms.admin.billing.TinhPhi;
import vn.aoms.admin.databinding.ItemInvoiceLineBinding;
import vn.aoms.admin.model.CanHo;
import vn.aoms.admin.model.KhoanPhi;

/** Preview of the invoice each apartment will receive. */
final class InvoiceLineAdapter extends RecyclerView.Adapter<InvoiceLineAdapter.Holder> {
    private List<CanHo> canHo = Collections.emptyList();
    private List<KhoanPhi> khoanPhi = Collections.emptyList();

    @SuppressLint("NotifyDataSetChanged") // the whole preview changes at once
    void setData(List<CanHo> canHo, List<KhoanPhi> khoanPhi) {
        this.canHo = canHo;
        this.khoanPhi = khoanPhi;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public Holder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return new Holder(ItemInvoiceLineBinding.inflate(LayoutInflater.from(parent.getContext()), parent, false));
    }

    @Override
    public void onBindViewHolder(@NonNull Holder holder, int position) {
        CanHo item = canHo.get(position);
        holder.binding.txtCanHo.setText(item.maCanHo + " · " + item.tenToaNha);
        holder.binding.txtChiTiet.setText(Ui.so(item.dienTich) + " m²");
        holder.binding.txtTongTien.setText(Ui.tien(TinhPhi.tongTien(khoanPhi, item.dienTich)));
    }

    @Override
    public int getItemCount() {
        return canHo.size();
    }

    static final class Holder extends RecyclerView.ViewHolder {
        final ItemInvoiceLineBinding binding;

        Holder(ItemInvoiceLineBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }
    }
}
