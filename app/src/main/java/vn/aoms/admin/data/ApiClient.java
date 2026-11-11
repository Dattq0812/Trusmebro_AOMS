package vn.aoms.admin.data;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

import vn.aoms.admin.BuildConfig;

/** Minimal JSON client for the AOMS backend: adds the JWT, maps error responses to ApiException. */
public final class ApiClient {
    private final Session session;

    public ApiClient(Session session) {
        this.session = session;
    }

    public JSONObject get(String path) throws IOException, ApiException {
        return send("GET", path, null);
    }

    public JSONObject post(String path, JSONObject body) throws IOException, ApiException {
        return send("POST", path, body);
    }

    private JSONObject send(String method, String path, JSONObject body) throws IOException, ApiException {
        HttpURLConnection connection = (HttpURLConnection) new URL(BuildConfig.API_BASE_URL + path).openConnection();
        try {
            connection.setRequestMethod(method);
            connection.setConnectTimeout(10_000);
            connection.setReadTimeout(15_000);
            connection.setRequestProperty("Accept", "application/json");
            String token = session.token();
            if (token != null) {
                connection.setRequestProperty("Authorization", "Bearer " + token);
            }
            if (body != null) {
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                try (OutputStream out = connection.getOutputStream()) {
                    out.write(body.toString().getBytes(StandardCharsets.UTF_8));
                }
            }

            int status = connection.getResponseCode();
            JSONObject json = parse(status >= 400 ? connection.getErrorStream() : connection.getInputStream());
            if (status >= 400) {
                if (status == 401) {
                    session.clear();
                }
                throw new ApiException(status, json.optString("loi", "Lỗi máy chủ (" + status + ")"));
            }
            return json;
        } finally {
            connection.disconnect();
        }
    }

    private static JSONObject parse(InputStream in) throws IOException {
        if (in == null) {
            return new JSONObject();
        }
        StringBuilder text = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                text.append(line);
            }
        }
        try {
            return text.length() == 0 ? new JSONObject() : new JSONObject(text.toString());
        } catch (JSONException e) {
            // Non-JSON body (e.g. a proxy error page): treat as empty so the status code decides.
            return new JSONObject();
        }
    }
}
