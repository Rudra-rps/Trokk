package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	store "github.com/andy/trokk/internal/store/pg"
)

type authCtxKey int

const authInfoKey authCtxKey = iota

type AuthInfo struct {
	IsAdmin bool
	AgentID uuid.UUID
}

var (
	ErrAuthRequired = errors.New("authentication required")
	ErrForbidden    = errors.New("forbidden")
)

func Authenticate(pool *pgxpool.Pool, adminKey string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" {
				next.ServeHTTP(w, r)
				return
			}

			token := strings.TrimPrefix(header, "Bearer ")
			if token == header {
				next.ServeHTTP(w, r)
				return
			}

			info := AuthInfo{}

			if token == adminKey {
				info.IsAdmin = true
			} else {
				agent, err := store.GetAgentByAPIKey(r.Context(), pool, token)
				if err != nil {
					http.Error(w, `{"error":"internal_server_error"}`, http.StatusInternalServerError)
					return
				}
				if agent != nil {
					info.AgentID = agent.ID
				}
			}

			ctx := context.WithValue(r.Context(), authInfoKey, info)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetAuthInfo(ctx context.Context) (AuthInfo, bool) {
	info, ok := ctx.Value(authInfoKey).(AuthInfo)
	if !ok {
		return AuthInfo{}, false
	}
	return info, info.IsAdmin || info.AgentID != uuid.Nil
}

func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		info, ok := r.Context().Value(authInfoKey).(AuthInfo)
		if !ok || !info.IsAdmin {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"error":"admin_required"}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}

func RequireAgent(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		info, ok := r.Context().Value(authInfoKey).(AuthInfo)
		if !ok || info.AgentID == uuid.Nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"error":"agent_key_required"}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		info, ok := r.Context().Value(authInfoKey).(AuthInfo)
		if !ok || (!info.IsAdmin && info.AgentID == uuid.Nil) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error":"authentication_required"}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}
