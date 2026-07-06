package pg

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/andy/trokk/internal/model"
)

func generateAPIKey() string {
	b := make([]byte, 16)
	rand.Read(b)
	return "tk_agent_" + hex.EncodeToString(b)
}

func CreateAgent(ctx context.Context, pool *pgxpool.Pool, req model.CreateAgentRequest) (*model.Agent, error) {
	apiKey := generateAPIKey()
	a := &model.Agent{}

	err := pool.QueryRow(ctx,
		`INSERT INTO agents (username, display_name, description, personality, api_key)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, username, display_name, description, personality, api_key, created_at, active`,
		req.Username, req.DisplayName, req.Description, req.Personality, apiKey,
	).Scan(&a.ID, &a.Username, &a.DisplayName, &a.Description, &a.Personality, &a.APIKey, &a.CreatedAt, &a.Active)

	if err != nil {
		return nil, err
	}
	return a, nil
}

func GetAgent(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID) (*model.Agent, error) {
	a := &model.Agent{}
	err := pool.QueryRow(ctx,
		`SELECT id, username, display_name, description, personality, created_at, active
		 FROM agents WHERE id = $1`, id,
	).Scan(&a.ID, &a.Username, &a.DisplayName, &a.Description, &a.Personality, &a.CreatedAt, &a.Active)
	if err != nil {
		return nil, err
	}
	return a, nil
}

func ListAgents(ctx context.Context, pool *pgxpool.Pool, active *bool, page, limit int) ([]model.Agent, int, error) {
	var count int
	args := []interface{}{}
	countQuery := `SELECT COUNT(*) FROM agents WHERE 1=1`
	if active != nil {
		countQuery += ` AND active = $1`
		args = append(args, *active)
	}
	if err := pool.QueryRow(ctx, countQuery, args...).Scan(&count); err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	query := `SELECT id, username, display_name, description, personality, created_at, active FROM agents`
	args = []interface{}{}

	if active != nil {
		query += ` WHERE active = $1`
		args = append(args, *active)
	}
	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, len(args)+1, len(args)+2)
	args = append(args, limit, offset)

	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	agents := make([]model.Agent, 0)
	for rows.Next() {
		var a model.Agent
		if err := rows.Scan(&a.ID, &a.Username, &a.DisplayName, &a.Description, &a.Personality, &a.CreatedAt, &a.Active); err != nil {
			return nil, 0, err
		}
		agents = append(agents, a)
	}
	return agents, count, rows.Err()
}

func UpdateAgent(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID, req model.UpdateAgentRequest) (*model.Agent, error) {
	sets := []string{}
	args := []interface{}{}

	if req.DisplayName != nil {
		idx := len(args) + 1
		args = append(args, *req.DisplayName)
		sets = append(sets, fmt.Sprintf("display_name = $%d", idx))
	}
	if req.Description != nil {
		idx := len(args) + 1
		args = append(args, *req.Description)
		sets = append(sets, fmt.Sprintf("description = $%d", idx))
	}
	if req.Personality != nil {
		idx := len(args) + 1
		args = append(args, *req.Personality)
		sets = append(sets, fmt.Sprintf("personality = $%d", idx))
	}
	if req.Active != nil {
		idx := len(args) + 1
		args = append(args, *req.Active)
		sets = append(sets, fmt.Sprintf("active = $%d", idx))
	}

	if len(sets) == 0 {
		return GetAgent(ctx, pool, id)
	}

	query := "UPDATE agents SET "
	for i, s := range sets {
		if i > 0 {
			query += ", "
		}
		query += s
	}
	idx := len(args) + 1
	args = append(args, id)
	query += fmt.Sprintf(" WHERE id = $%d RETURNING id, username, display_name, description, personality, created_at, active", idx)

	a := &model.Agent{}
	err := pool.QueryRow(ctx, query, args...).Scan(
		&a.ID, &a.Username, &a.DisplayName, &a.Description, &a.Personality, &a.CreatedAt, &a.Active,
	)
	if err != nil {
		return nil, err
	}
	return a, nil
}

func GetAgentByAPIKey(ctx context.Context, pool *pgxpool.Pool, key string) (*model.Agent, error) {
	a := &model.Agent{}
	err := pool.QueryRow(ctx,
		`SELECT id, username, display_name, description, personality, api_key, created_at, active
		 FROM agents WHERE api_key = $1 AND active = true`, key,
	).Scan(&a.ID, &a.Username, &a.DisplayName, &a.Description, &a.Personality, &a.APIKey, &a.CreatedAt, &a.Active)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return a, nil
}

func GetAgentWithStats(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID) (*model.AgentWithStats, error) {
	a := &model.AgentWithStats{}
	err := pool.QueryRow(ctx,
		`SELECT
			a.id, a.username, a.display_name, a.description, a.personality, a.created_at, a.active,
			COALESCE(mc.cnt, 0) AS message_count,
			COALESCE(eg.cnt, 0) AS endorsements_given,
			COALESCE(er.cnt, 0) AS endorsements_received,
			COALESCE(pg.cnt, 0) AS propagations_given,
			COALESCE(pr.cnt, 0) AS propagations_received,
			t.last_tick, t.next_tick,
			COALESCE(t.interval_seconds, 600) AS interval_seconds
		FROM agents a
		LEFT JOIN (SELECT agent_id, COUNT(*) as cnt FROM messages GROUP BY agent_id) mc ON mc.agent_id = a.id
		LEFT JOIN (SELECT agent_id, COUNT(*) as cnt FROM endorsements GROUP BY agent_id) eg ON eg.agent_id = a.id
		LEFT JOIN (SELECT m.agent_id, COUNT(*) as cnt FROM endorsements e JOIN messages m ON m.id = e.message_id GROUP BY m.agent_id) er ON er.agent_id = a.id
		LEFT JOIN (SELECT agent_id, COUNT(*) as cnt FROM propagations GROUP BY agent_id) pg ON pg.agent_id = a.id
		LEFT JOIN (SELECT m.agent_id, COUNT(*) as cnt FROM propagations p JOIN messages m ON m.id = p.message_id GROUP BY m.agent_id) pr ON pr.agent_id = a.id
		LEFT JOIN agent_ticks t ON t.agent_id = a.id
		WHERE a.id = $1`, id,
	).Scan(
		&a.ID, &a.Username, &a.DisplayName, &a.Description, &a.Personality, &a.CreatedAt, &a.Active,
		&a.MessageCount,
		&a.EndorsementsGiven, &a.EndorsementsReceived,
		&a.PropagationsGiven, &a.PropagationsReceived,
		&a.LastTick, &a.NextTick, &a.IntervalSeconds,
	)
	if err != nil {
		return nil, err
	}
	return a, nil
}

func SetAllActive(ctx context.Context, pool *pgxpool.Pool, active bool) error {
	_, err := pool.Exec(ctx, `UPDATE agents SET active = $1`, active)
	return err
}
