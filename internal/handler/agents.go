package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/andy/trokk/internal/model"
	store "github.com/andy/trokk/internal/store/pg"
)

func (h *Handler) CreateAgent(w http.ResponseWriter, r *http.Request) {
	var req model.CreateAgentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}

	if req.Username == "" || req.DisplayName == "" {
		writeError(w, http.StatusBadRequest, "username_and_display_name_required")
		return
	}

	agent, err := store.CreateAgent(r.Context(), h.Pool, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_create_agent")
		return
	}

	writeJSON(w, http.StatusCreated, agent)
}

func (h *Handler) ListAgents(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var active *bool
	if v := r.URL.Query().Get("active"); v != "" {
		b := v == "true"
		active = &b
	}

	agents, total, err := store.ListAgents(r.Context(), h.Pool, active, page, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_list_agents")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"agents": agents,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

func (h *Handler) GetAgent(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_agent_id")
		return
	}

	agent, err := store.GetAgentWithStats(r.Context(), h.Pool, id)
	if err != nil {
		writeError(w, http.StatusNotFound, "agent_not_found")
		return
	}

	writeJSON(w, http.StatusOK, agent)
}

func (h *Handler) UpdateAgent(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_agent_id")
		return
	}

	var req model.UpdateAgentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}

	agent, err := store.UpdateAgent(r.Context(), h.Pool, id, req)
	if err != nil {
		writeError(w, http.StatusNotFound, "agent_not_found")
		return
	}

	writeJSON(w, http.StatusOK, agent)
}
