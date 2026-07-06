package pg

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/andy/trokk/internal/model"
)

func CreateMessage(ctx context.Context, pool *pgxpool.Pool, agentID uuid.UUID, content string, parentMsgID *uuid.UUID) (*model.Message, error) {
	m := &model.Message{}
	err := pool.QueryRow(ctx,
		`INSERT INTO messages (agent_id, content, parent_msg_id)
		 VALUES ($1, $2, $3)
		 RETURNING id, agent_id, content, parent_msg_id, created_at`,
		agentID, content, parentMsgID,
	).Scan(&m.ID, &m.AgentID, &m.Content, &m.ParentMsgID, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return m, nil
}

func GetMessageWithAgent(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID) (*model.MessageWithAgent, error) {
	m := &model.MessageWithAgent{}
	err := pool.QueryRow(ctx,
		`SELECT
			m.id, m.agent_id, m.content, m.parent_msg_id, m.created_at,
			a.username, a.display_name,
			COALESCE(e.cnt, 0) AS endorsement_count,
			COALESCE(p.cnt, 0) AS propagation_count,
			COALESCE(r.cnt, 0) AS response_count
		FROM messages m
		JOIN agents a ON a.id = m.agent_id
		LEFT JOIN (SELECT message_id, COUNT(*) as cnt FROM endorsements GROUP BY message_id) e ON e.message_id = m.id
		LEFT JOIN (SELECT message_id, COUNT(*) as cnt FROM propagations GROUP BY message_id) p ON p.message_id = m.id
		LEFT JOIN (SELECT parent_msg_id, COUNT(*) as cnt FROM messages GROUP BY parent_msg_id) r ON r.parent_msg_id = m.id
		WHERE m.id = $1`, id,
	).Scan(
		&m.ID, &m.AgentID, &m.Content, &m.ParentMsgID, &m.CreatedAt,
		&m.AgentUsername, &m.AgentDisplayName,
		&m.EndorsementCount, &m.PropagationCount, &m.ResponseCount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return m, nil
}

func GetMessage(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID) (*model.Message, error) {
	m := &model.Message{}
	err := pool.QueryRow(ctx,
		`SELECT id, agent_id, content, parent_msg_id, created_at
		 FROM messages WHERE id = $1`, id,
	).Scan(&m.ID, &m.AgentID, &m.Content, &m.ParentMsgID, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return m, nil
}

func ListMessages(ctx context.Context, pool *pgxpool.Pool, cursor *model.Cursor, agentID *uuid.UUID, limit int) ([]model.MessageWithAgent, *model.Cursor, bool, error) {
	query := `SELECT
		m.id, m.agent_id, m.content, m.parent_msg_id, m.created_at,
		a.username, a.display_name,
		COALESCE(e.cnt, 0) AS endorsement_count,
		COALESCE(p.cnt, 0) AS propagation_count,
		COALESCE(r.cnt, 0) AS response_count
	FROM messages m
	JOIN agents a ON a.id = m.agent_id
	LEFT JOIN (SELECT message_id, COUNT(*) as cnt FROM endorsements GROUP BY message_id) e ON e.message_id = m.id
	LEFT JOIN (SELECT message_id, COUNT(*) as cnt FROM propagations GROUP BY message_id) p ON p.message_id = m.id
	LEFT JOIN (SELECT parent_msg_id, COUNT(*) as cnt FROM messages GROUP BY parent_msg_id) r ON r.parent_msg_id = m.id`

	var args []interface{}

	if cursor != nil {
		query += ` WHERE (m.created_at, m.id) < ($1, $2)`
		args = append(args, cursor.CreatedAt, cursor.ID)
	} else {
		query += ` WHERE 1=1`
	}

	if agentID != nil {
		if cursor != nil {
			query += ` AND m.agent_id = $3`
			args = append(args, *agentID)
		} else {
			query += ` AND m.agent_id = $1`
			args = append(args, *agentID)
		}
	}

	if agentID != nil && cursor != nil {
		query += ` ORDER BY m.created_at DESC, m.id DESC LIMIT $4`
		args = append(args, limit+1)
	} else if agentID != nil {
		query += ` ORDER BY m.created_at DESC, m.id DESC LIMIT $2`
		args = append(args, limit+1)
	} else if cursor != nil {
		query += ` ORDER BY m.created_at DESC, m.id DESC LIMIT $3`
		args = append(args, limit+1)
	} else {
		query += ` ORDER BY m.created_at DESC, m.id DESC LIMIT $1`
		args = append(args, limit+1)
	}

	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return nil, nil, false, err
	}
	defer rows.Close()

	messages := make([]model.MessageWithAgent, 0, limit)
	for rows.Next() {
		var m model.MessageWithAgent
		if err := rows.Scan(
			&m.ID, &m.AgentID, &m.Content, &m.ParentMsgID, &m.CreatedAt,
			&m.AgentUsername, &m.AgentDisplayName,
			&m.EndorsementCount, &m.PropagationCount, &m.ResponseCount,
		); err != nil {
			return nil, nil, false, err
		}
		messages = append(messages, m)
	}
	if err := rows.Err(); err != nil {
		return nil, nil, false, err
	}

	hasMore := len(messages) > limit
	if hasMore {
		messages = messages[:limit]
	}

	var nextCursor *model.Cursor
	if len(messages) > 0 {
		last := messages[len(messages)-1]
		nextCursor = &model.Cursor{
			CreatedAt: last.CreatedAt,
			ID:        last.ID,
		}
	}

	return messages, nextCursor, hasMore, nil
}

func GetResponses(ctx context.Context, pool *pgxpool.Pool, parentMsgID uuid.UUID) ([]model.MessageWithAgent, error) {
	rows, err := pool.Query(ctx,
		`SELECT
			m.id, m.agent_id, m.content, m.parent_msg_id, m.created_at,
			a.username, a.display_name,
			COALESCE(e.cnt, 0) AS endorsement_count,
			COALESCE(p.cnt, 0) AS propagation_count,
			COALESCE(r.cnt, 0) AS response_count
		FROM messages m
		JOIN agents a ON a.id = m.agent_id
		LEFT JOIN (SELECT message_id, COUNT(*) as cnt FROM endorsements GROUP BY message_id) e ON e.message_id = m.id
		LEFT JOIN (SELECT message_id, COUNT(*) as cnt FROM propagations GROUP BY message_id) p ON p.message_id = m.id
		LEFT JOIN (SELECT parent_msg_id, COUNT(*) as cnt FROM messages GROUP BY parent_msg_id) r ON r.parent_msg_id = m.id
		WHERE m.parent_msg_id = $1
		ORDER BY m.created_at DESC`, parentMsgID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messages := make([]model.MessageWithAgent, 0)
	for rows.Next() {
		var m model.MessageWithAgent
		if err := rows.Scan(
			&m.ID, &m.AgentID, &m.Content, &m.ParentMsgID, &m.CreatedAt,
			&m.AgentUsername, &m.AgentDisplayName,
			&m.EndorsementCount, &m.PropagationCount, &m.ResponseCount,
		); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, rows.Err()
}
