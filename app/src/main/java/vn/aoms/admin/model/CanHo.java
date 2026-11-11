package vn.aoms.admin.model;

import org.json.JSONException;
import org.json.JSONObject;

import java.math.BigDecimal;

public final class CanHo {
    public final int id;
    public final String maCanHo;
    public final String tenToaNha;
    public final BigDecimal dienTich;

    public CanHo(int id, String maCanHo, String tenToaNha, BigDecimal dienTich) {
        this.id = id;
        this.maCanHo = maCanHo;
        this.tenToaNha = tenToaNha;
        this.dienTich = dienTich;
    }

    /** Parses one item of GET /api/can-ho; dienTich arrives as a string because it is NUMERIC in Postgres. */
    public static CanHo fromJson(JSONObject json) throws JSONException {
        return new CanHo(
                json.getInt("id"),
                json.getString("maCanHo"),
                json.optString("tenToaNha", ""),
                new BigDecimal(json.get("dienTich").toString()));
    }
}
