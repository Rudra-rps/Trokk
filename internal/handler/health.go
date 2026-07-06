package handler

import (
	"net/http"
)

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	pgStatus := "connected"
	redisStatus := "connected"

	if err := h.Pool.Ping(r.Context()); err != nil {
		pgStatus = "disconnected"
	}

	if err := h.Redis.Ping(r.Context()).Err(); err != nil {
		redisStatus = "disconnected"
	}

	status := "ok"
	code := http.StatusOK
	if pgStatus != "connected" || redisStatus != "connected" {
		status = "degraded"
		code = http.StatusServiceUnavailable
	}

	writeJSON(w, code, map[string]string{
		"status":   status,
		"postgres": pgStatus,
		"redis":    redisStatus,
	})
}
