package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
	goredis "github.com/redis/go-redis/v9"

	"github.com/andy/trokk/internal/config"
	"github.com/andy/trokk/internal/handler"
	"github.com/andy/trokk/internal/middleware"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	var level slog.Level
	switch cfg.LogLevel {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	default:
		level = slog.LevelInfo
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: level})))

	ctx := context.Background()

	poolCfg, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to parse database url", "error", err)
		os.Exit(1)
	}
	poolCfg.MaxConns = 20

	pgPool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		slog.Error("failed to connect to postgres", "error", err)
		os.Exit(1)
	}
	defer pgPool.Close()

	if err := pgPool.Ping(ctx); err != nil {
		slog.Error("postgres ping failed", "error", err)
		os.Exit(1)
	}
	slog.Info("connected to postgres")

	rdbOpts, err := goredis.ParseURL(cfg.RedisURL)
	if err != nil {
		slog.Error("failed to parse redis url", "error", err)
		os.Exit(1)
	}
	rdb := goredis.NewClient(rdbOpts)
	if err := rdb.Ping(ctx).Err(); err != nil {
		slog.Error("redis ping failed", "error", err)
		os.Exit(1)
	}
	defer rdb.Close()
	slog.Info("connected to redis")

	slog.Info("running database migrations")
	db := stdlib.OpenDBFromPool(pgPool)
	defer db.Close()
	if err := goose.Up(db, "migrations"); err != nil {
		slog.Error("migration failed", "error", err)
		os.Exit(1)
	}
	slog.Info("migrations complete")

	h := &handler.Handler{
		Pool:      pgPool,
		Redis:     rdb,
		AdminKey:  cfg.AdminAPIKey,
		ConfigDir: cfg.ConfigDir,
	}

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Logging)
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-Id"},
		ExposedHeaders:   []string{"X-Request-Id"},
		AllowCredentials: false,
		MaxAge:           300,
	}))
	r.Use(middleware.Authenticate(pgPool, cfg.AdminAPIKey))

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", h.Health)

		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAdmin)

			r.Post("/agents", h.CreateAgent)
			r.Get("/agents", h.ListAgents)
			r.Get("/agents/{id}", h.GetAgent)
			r.Patch("/agents/{id}", h.UpdateAgent)

			r.Get("/messages/{id}", h.GetMessage)

			r.Get("/control/status", h.ControlStatus)
			r.Post("/control/tick/{agentId}", h.ControlTick)
			r.Post("/control/pause-all", h.ControlPauseAll)
			r.Post("/control/resume-all", h.ControlResumeAll)
			r.Get("/control/configs", h.ControlConfigs)
		})

		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAgent)

			r.Post("/messages", h.CreateMessage)
			r.Post("/messages/{id}/respond", h.RespondToMessage)
			r.Post("/messages/{id}/endorse", h.ToggleEndorse)
			r.Post("/messages/{id}/propagate", h.TogglePropagate)
		})

		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAuth)
			r.Get("/messages", h.ListMessages)
		})
	})

	addr := fmt.Sprintf(":%d", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		slog.Info("server starting", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-done
	slog.Info("shutting down gracefully")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("shutdown error", "error", err)
	}
	slog.Info("server stopped")
}
