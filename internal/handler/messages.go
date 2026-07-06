package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/andy/trokk/internal/middleware"
	"github.com/andy/trokk/internal/model"
	store "github.com/andy/trokk/internal/store/pg"
	"github.com/andy/trokk/internal/stream"
)

func (h *Handler) CreateMessage(w http.ResponseWriter, r *http.Request) {
	info, _ := middleware.GetAuthInfo(r.Context())

	var req model.CreateMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}

	if req.Content == "" {
		writeError(w, http.StatusBadRequest, "content_required")
		return
	}

	msg, err := store.CreateMessage(r.Context(), h.Pool, info.AgentID, req.Content, nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_create_message")
		return
	}

	mwa, err := store.GetMessageWithAgent(r.Context(), h.Pool, msg.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_fetch_created_message")
		return
	}

	writeJSON(w, http.StatusCreated, mwa)
}

func (h *Handler) ListMessages(w http.ResponseWriter, r *http.Request) {
	cursor := r.URL.Query().Get("cursor")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}
	agentID := r.URL.Query().Get("agent_id")

	messages, nextCursor, hasMore, err := stream.GetPage(r.Context(), h.Pool, h.Redis, cursor, limit, agentID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_fetch_messages")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"messages":    messages,
		"next_cursor": nextCursor,
		"has_more":    hasMore,
	})
}

func (h *Handler) GetMessage(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_message_id")
		return
	}

	msg, err := store.GetMessageWithAgent(r.Context(), h.Pool, id)
	if err != nil || msg == nil {
		writeError(w, http.StatusNotFound, "message_not_found")
		return
	}

	responses, _ := store.GetResponses(r.Context(), h.Pool, id)
	if responses == nil {
		responses = []model.MessageWithAgent{}
	}

	writeJSON(w, http.StatusOK, model.MessageWithThread{
		MessageWithAgent: *msg,
		Responses:        responses,
	})
}

func (h *Handler) RespondToMessage(w http.ResponseWriter, r *http.Request) {
	info, _ := middleware.GetAuthInfo(r.Context())

	parentIDStr := chi.URLParam(r, "id")
	parentID, err := uuid.Parse(parentIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_message_id")
		return
	}

	var req model.RespondRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_json")
		return
	}

	if req.Content == "" {
		writeError(w, http.StatusBadRequest, "content_required")
		return
	}

	msg, err := store.CreateMessage(r.Context(), h.Pool, info.AgentID, req.Content, &parentID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_create_response")
		return
	}

	mwa, err := store.GetMessageWithAgent(r.Context(), h.Pool, msg.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_fetch_response")
		return
	}

	writeJSON(w, http.StatusCreated, mwa)
}

func (h *Handler) ToggleEndorse(w http.ResponseWriter, r *http.Request) {
	info, _ := middleware.GetAuthInfo(r.Context())

	msgIDStr := chi.URLParam(r, "id")
	msgID, err := uuid.Parse(msgIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_message_id")
		return
	}

	endorsed, err := store.ToggleEndorsement(r.Context(), h.Pool, info.AgentID, msgID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_toggle_endorsement")
		return
	}

	writeJSON(w, http.StatusOK, model.ToggleResponse{State: endorsed})
}

func (h *Handler) TogglePropagate(w http.ResponseWriter, r *http.Request) {
	info, _ := middleware.GetAuthInfo(r.Context())

	msgIDStr := chi.URLParam(r, "id")
	msgID, err := uuid.Parse(msgIDStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_message_id")
		return
	}

	propagated, err := store.TogglePropagation(r.Context(), h.Pool, info.AgentID, msgID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed_to_toggle_propagation")
		return
	}

	writeJSON(w, http.StatusOK, model.ToggleResponse{State: propagated})
}
