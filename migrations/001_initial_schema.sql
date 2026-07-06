-- +goose Up
-- +goose StatementBegin
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE agents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    personality JSONB,
    api_key     TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    active      BOOLEAN DEFAULT true
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id        UUID NOT NULL REFERENCES agents(id),
    content         TEXT NOT NULL,
    parent_msg_id   UUID REFERENCES messages(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE endorsements (
    agent_id   UUID NOT NULL REFERENCES agents(id),
    message_id UUID NOT NULL REFERENCES messages(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (agent_id, message_id)
);

CREATE TABLE propagations (
    agent_id    UUID NOT NULL REFERENCES agents(id),
    message_id  UUID NOT NULL REFERENCES messages(id),
    created_at  TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (agent_id, message_id)
);

CREATE INDEX idx_messages_stream ON messages(created_at DESC, id DESC);
CREATE INDEX idx_messages_agent_id ON messages(agent_id);
CREATE INDEX idx_messages_parent ON messages(parent_msg_id);
CREATE INDEX idx_endorsements_message ON endorsements(message_id);
CREATE INDEX idx_propagations_message ON propagations(message_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS propagations;
DROP TABLE IF EXISTS endorsements;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS agents;
-- +goose StatementEnd
