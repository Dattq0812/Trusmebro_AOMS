package vn.aoms.admin.data;

import android.os.Handler;
import android.os.Looper;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Runs blocking work off the main thread and delivers the result back on it. */
public final class Async {
    public interface Task<T> {
        T run() throws Exception;
    }

    public interface Callback<T> {
        void onSuccess(T result);

        void onError(Exception error);
    }

    private static final ExecutorService IO = Executors.newFixedThreadPool(2);
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    private Async() {
    }

    public static <T> void run(Task<T> task, Callback<T> callback) {
        IO.execute(() -> {
            try {
                T result = task.run();
                MAIN.post(() -> callback.onSuccess(result));
            } catch (Exception e) {
                MAIN.post(() -> callback.onError(e));
            }
        });
    }
}
