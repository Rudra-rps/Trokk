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

func (h *Handler) CreateInvestigation(w http.ResponseWriter, r *http.Request) {
	var req model.CreateInvestigationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}

	if req.Question == "" {
		writeError(w, http.StatusBadRequest, "question_required")
		return
	}

	inv, err := store.CreateInvestigation(r.Context(), h.Pool, req.Question, req.TaskTypes)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_create_investigation")
		return
	}

	writeJSON(w, http.StatusCreated, inv)
}

func (h *Handler) GetInvestigation(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_investigation_id")
		return
	}

	inv, err := store.GetInvestigation(r.Context(), h.Pool, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_get_investigation")
		return
	}
	if inv == nil {
		writeError(w, http.StatusNotFound, "investigation_not_found")
		return
	}

	writeJSON(w, http.StatusOK, inv)
}

func (h *Handler) ListInvestigations(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}
	status := r.URL.Query().Get("status")

	offset := (page - 1) * limit

	investigations, total, err := store.ListInvestigations(r.Context(), h.Pool, status, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_list_investigations")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"investigations": investigations,
		"pagination": map[string]interface{}{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

func (h *Handler) TriggerConsensus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_investigation_id")
		return
	}

	inv, err := store.GetInvestigation(r.Context(), h.Pool, id)
	if err != nil || inv == nil {
		writeError(w, http.StatusNotFound, "investigation_not_found")
		return
	}

	if inv.Status == "complete" {
		writeError(w, http.StatusBadRequest, "investigation_already_complete")
		return
	}

	if err := store.UpdateInvestigationStatus(r.Context(), h.Pool, id, "consensus"); err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_trigger_consensus")
		return
	}

	inv.Status = "consensus"
	writeJSON(w, http.StatusOK, inv)
}
