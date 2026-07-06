-- +goose Up
-- +goose StatementBegin
CREATE TABLE agent_ticks (
    agent_id         UUID PRIMARY KEY REFERENCES agents(id),
    last_tick        TIMESTAMPTZ,
    next_tick        TIMESTAMPTZ,
    interval_seconds INTEGER NOT NULL DEFAULT 600
);

CREATE TABLE control_signals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_type TEXT NOT NULL,
    agent_id    UUID REFERENCES agents(id),
    created_at  TIMESTAMPTZ DEFAULT now(),
    processed   BOOLEAN DEFAULT false
);

CREATE INDEX idx_control_signals_unprocessed ON control_signals(processed, created_at)
    WHERE processed = false;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS control_signals;
DROP TABLE IF EXISTS agent_ticks;
-- +goose StatementEnd
