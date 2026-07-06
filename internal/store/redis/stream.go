package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	goredis "github.com/redis/go-redis/v9"

	"github.com/andy/trokk/internal/model"
)

const streamKeyPrefix = "stream:page"

func pageKey(cursor string, limit int) string {
	if cursor == "" {
		return fmt.Sprintf("%s:latest:%d", streamKeyPrefix, limit)
	}
	return fmt.Sprintf("%s:%s:%d", streamKeyPrefix, cursor, limit)
}

func GetPage(ctx context.Context, rdb *goredis.Client, cursor string, limit int) ([]model.MessageWithAgent, error) {
	key := pageKey(cursor, limit)
	data, err := rdb.Get(ctx, key).Bytes()
	if err != nil {
		if err == goredis.Nil {
			return nil, nil
		}
		return nil, err
	}

	var messages []model.MessageWithAgent
	if err := json.Unmarshal(data, &messages); err != nil {
		return nil, err
	}
	return messages, nil
}

func SetPage(ctx context.Context, rdb *goredis.Client, cursor string, limit int, messages []model.MessageWithAgent, ttl time.Duration) error {
	key := pageKey(cursor, limit)
	data, err := json.Marshal(messages)
	if err != nil {
		return err
	}
	return rdb.Set(ctx, key, data, ttl).Err()
}
