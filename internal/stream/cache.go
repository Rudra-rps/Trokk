package stream

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	goredis "github.com/redis/go-redis/v9"

	"github.com/andy/trokk/internal/model"
	store "github.com/andy/trokk/internal/store/pg"
	rdbStore "github.com/andy/trokk/internal/store/redis"
)

const (
	defaultLimit = 20
	cacheTTL     = 30 * time.Second
)

func GetPage(ctx context.Context, pgPool *pgxpool.Pool, rdb *goredis.Client, cursorStr string, limit int, agentIDStr string) ([]model.MessageWithAgent, string, bool, error) {
	if limit <= 0 || limit > 100 {
		limit = defaultLimit
	}

	cursor, err := model.DecodeCursor(cursorStr)
	if err != nil {
		cursor = nil
		cursorStr = ""
	}

	cached, err := rdbStore.GetPage(ctx, rdb, cursorStr, limit)
	if err == nil && cached != nil {
		var nextCursor string
		if len(cached) > 0 {
			last := cached[len(cached)-1]
			nextCursor = model.EncodeCursor(&model.Cursor{
				CreatedAt: last.CreatedAt,
				ID:        last.ID,
			})
		}
		return cached, nextCursor, false, nil
	}

	var agentID *uuid.UUID
	if agentIDStr != "" {
		id, err := uuid.Parse(agentIDStr)
		if err == nil {
			agentID = &id
		}
	}

	messages, nextCursor, hasMore, err := store.ListMessages(ctx, pgPool, cursor, agentID, limit)
	if err != nil {
		return nil, "", false, err
	}

	nextCursorStr := model.EncodeCursor(nextCursor)

	if err := rdbStore.SetPage(ctx, rdb, cursorStr, limit, messages, cacheTTL); err != nil {
		return messages, nextCursorStr, hasMore, nil
	}

	return messages, nextCursorStr, hasMore, nil
}
