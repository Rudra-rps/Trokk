package pg

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/andy/trokk/internal/model"
)

func ToggleEndorsement(ctx context.Context, pool *pgxpool.Pool, agentID, messageID uuid.UUID) (bool, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)

	tag, err := tx.Exec(ctx,
		`DELETE FROM endorsements WHERE agent_id = $1 AND message_id = $2`,
		agentID, messageID,
	)
	if err != nil {
		return false, err
	}

	if tag.RowsAffected() == 0 {
		_, err = tx.Exec(ctx,
			`INSERT INTO endorsements (agent_id, message_id) VALUES ($1, $2)`,
			agentID, messageID,
		)
		if err != nil {
			return false, err
		}
		if err := tx.Commit(ctx); err != nil {
			return false, err
		}
		return true, nil
	}

	if err := tx.Commit(ctx); err != nil {
		return false, err
	}
	return false, nil
}

func TogglePropagation(ctx context.Context, pool *pgxpool.Pool, agentID, messageID uuid.UUID) (bool, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)

	tag, err := tx.Exec(ctx,
		`DELETE FROM propagations WHERE agent_id = $1 AND message_id = $2`,
		agentID, messageID,
	)
	if err != nil {
		return false, err
	}

	if tag.RowsAffected() == 0 {
		_, err = tx.Exec(ctx,
			`INSERT INTO propagations (agent_id, message_id) VALUES ($1, $2)`,
			agentID, messageID,
		)
		if err != nil {
			return false, err
		}
		if err := tx.Commit(ctx); err != nil {
			return false, err
		}
		return true, nil
	}

	if err := tx.Commit(ctx); err != nil {
		return false, err
	}
	return false, nil
}

func CreateControlSignal(ctx context.Context, pool *pgxpool.Pool, signalType string, agentID uuid.UUID) error {
	_, err := pool.Exec(ctx,
		`INSERT INTO control_signals (signal_type, agent_id) VALUES ($1, $2)`,
		signalType, agentID,
	)
	return err
}

func GetControlStatus(ctx context.Context, pool *pgxpool.Pool) ([]model.ControlAgentStatus, error) {
	rows, err := pool.Query(ctx,
		`SELECT
			a.id, a.username, a.active,
			t.last_tick, t.next_tick,
			COALESCE(t.interval_seconds, 600)
		FROM agents a
		LEFT JOIN agent_ticks t ON t.agent_id = a.id
		ORDER BY a.username`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	statuses := make([]model.ControlAgentStatus, 0)
	for rows.Next() {
		var s model.ControlAgentStatus
		if err := rows.Scan(&s.AgentID, &s.Username, &s.Active, &s.LastTick, &s.NextTick, &s.IntervalSeconds); err != nil {
			return nil, err
		}
		statuses = append(statuses, s)
	}
	return statuses, rows.Err()
}
