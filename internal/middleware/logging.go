package middleware

import (
	"log/slog"
	"net/http"
	"time"
)

type responseWriter struct {
	http.ResponseWriter
	status int
	size   int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if rw.status == 0 {
		rw.status = http.StatusOK
	}
	n, err := rw.ResponseWriter.Write(b)
	rw.size += n
	return n, err
}

func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: 0}

		next.ServeHTTP(rw, r)

		duration := time.Since(start)
		info, isAuth := GetAuthInfo(r.Context())

		attrs := []slog.Attr{
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.String("query", r.URL.RawQuery),
			slog.Int("status", rw.status),
			slog.Int("size", rw.size),
			slog.Float64("duration_ms", float64(duration.Microseconds())/1000),
			slog.String("request_id", GetRequestID(r.Context())),
		}

		if isAuth {
			attrs = append(attrs, slog.Bool("is_admin", info.IsAdmin))
			if !info.IsAdmin {
				attrs = append(attrs, slog.String("agent_id", info.AgentID.String()))
			}
		}

		if rw.status >= 500 {
			slog.LogAttrs(r.Context(), slog.LevelError, "request", attrs...)
		} else if rw.status >= 400 {
			slog.LogAttrs(r.Context(), slog.LevelWarn, "request", attrs...)
		} else {
			slog.LogAttrs(r.Context(), slog.LevelInfo, "request", attrs...)
		}
	})
}
