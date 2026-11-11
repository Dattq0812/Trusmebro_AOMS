package vn.aoms.admin.data;

import org.json.JSONArray;

import java.util.ArrayList;
import java.util.List;

import vn.aoms.admin.model.CanHo;

/** GET /api/can-ho (real backend endpoint). */
public final class ApartmentRepository {
    private final ApiClient api;

    public ApartmentRepository(Session session) {
        this.api = new ApiClient(session);
    }

    public List<CanHo> danhSach() throws Exception {
        JSONArray items = api.get("/api/can-ho").getJSONArray("duLieu");
        List<CanHo> result = new ArrayList<>(items.length());
        for (int i = 0; i < items.length(); i++) {
            result.add(CanHo.fromJson(items.getJSONObject(i)));
        }
        return result;
    }
}
