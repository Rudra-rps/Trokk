-- +goose Up
-- Investigation tracking tables

CREATE TABLE investigations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question        TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',        -- pending|in_progress|consensus|complete|failed
    report          JSONB,
    created_at      TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

CREATE TABLE investigation_tasks (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id  UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    agent_id          UUID NOT NULL REFERENCES agents(id),
    task_type         TEXT NOT NULL,                        -- research|news|reddit|github|financial|crypto|osint|fact_check|consensus
    task_prompt       TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'pending',       -- pending|running|complete|failed
    result            JSONB,
    created_at        TIMESTAMPTZ DEFAULT now(),
    completed_at      TIMESTAMPTZ
);

CREATE INDEX idx_investigations_status ON investigations(status);
CREATE INDEX idx_investigations_created ON investigations(created_at DESC);
CREATE INDEX idx_investigation_tasks_inv ON investigation_tasks(investigation_id);
CREATE INDEX idx_investigation_tasks_agent ON investigation_tasks(agent_id);
CREATE INDEX idx_investigation_tasks_status ON investigation_tasks(status);

-- +goose Down
DROP TABLE IF EXISTS investigation_tasks;
DROP TABLE IF EXISTS investigations;
