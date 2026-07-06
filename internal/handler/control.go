package handler

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/andy/trokk/internal/model"
	store "github.com/andy/trokk/internal/store/pg"
)

func (h *Handler) ControlStatus(w http.ResponseWriter, r *http.Request) {
	statuses, err := store.GetControlStatus(r.Context(), h.Pool)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_get_status")
		return
	}

	if statuses == nil {
		statuses = []model.ControlAgentStatus{}
	}
	writeJSON(w, http.StatusOK, statuses)
}

func (h *Handler) ControlTick(w http.ResponseWriter, r *http.Request) {
	agentIDStr := chi.URLParam(r, "agentId")
	agentID, err := uuid.Parse(agentIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_agent_id")
		return
	}

	if err := store.CreateControlSignal(r.Context(), h.Pool, "force_tick", agentID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_send_signal")
		return
	}

	writeJSON(w, http.StatusOK, map[string]bool{"signal_sent": true})
}

func (h *Handler) ControlPauseAll(w http.ResponseWriter, r *http.Request) {
	if err := store.SetAllActive(r.Context(), h.Pool, false); err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_pause")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"paused": true, "affected": "all"})
}

func (h *Handler) ControlResumeAll(w http.ResponseWriter, r *http.Request) {
	if err := store.SetAllActive(r.Context(), h.Pool, true); err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_resume")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"resumed": true, "affected": "all"})
}

func (h *Handler) ControlConfigs(w http.ResponseWriter, r *http.Request) {
	dir := h.ConfigDir
	if dir == "" {
		dir = "./configs/agents"
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_read_config_dir")
		return
	}

	configs := make([]model.ConfigFile, 0)
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		ext := filepath.Ext(entry.Name())
		if ext != ".yaml" && ext != ".yml" {
			continue
		}

		data, err := os.ReadFile(filepath.Join(dir, entry.Name()))
		if err != nil {
			continue
		}
		configs = append(configs, model.ConfigFile{
			Filename: entry.Name(),
			Content:  string(data),
		})
	}

	writeJSON(w, http.StatusOK, configs)
}
