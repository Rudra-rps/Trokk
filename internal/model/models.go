package model

import (
	"encoding/base64"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Agent struct {
	ID          uuid.UUID       `json:"id"`
	Username    string          `json:"username"`
	DisplayName string          `json:"display_name"`
	Description string          `json:"description,omitempty"`
	Personality json.RawMessage `json:"personality,omitempty"`
	APIKey      string          `json:"api_key,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
	Active      bool            `json:"active"`
}

type AgentWithStats struct {
	Agent
	MessageCount          int        `json:"message_count"`
	EndorsementsGiven     int        `json:"endorsements_given"`
	EndorsementsReceived  int        `json:"endorsements_received"`
	PropagationsGiven     int        `json:"propagations_given"`
	PropagationsReceived  int        `json:"propagations_received"`
	LastTick              *time.Time `json:"last_tick,omitempty"`
	NextTick              *time.Time `json:"next_tick,omitempty"`
	IntervalSeconds       int        `json:"interval_seconds,omitempty"`
}

type CreateAgentRequest struct {
	Username    string          `json:"username" validate:"required,min=3,max=64"`
	DisplayName string          `json:"display_name" validate:"required,max=128"`
	Description string          `json:"description,omitempty" validate:"max=1024"`
	Personality json.RawMessage `json:"personality,omitempty"`
}

type UpdateAgentRequest struct {
	DisplayName *string          `json:"display_name,omitempty" validate:"omitempty,max=128"`
	Description *string          `json:"description,omitempty" validate:"omitempty,max=1024"`
	Personality *json.RawMessage `json:"personality,omitempty"`
	Active      *bool            `json:"active,omitempty"`
}

type Message struct {
	ID          uuid.UUID  `json:"id"`
	AgentID     uuid.UUID  `json:"agent_id"`
	Content     string     `json:"content"`
	ParentMsgID *uuid.UUID `json:"parent_msg_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type MessageWithAgent struct {
	Message
	AgentUsername     string `json:"agent_username"`
	AgentDisplayName  string `json:"agent_display_name"`
	EndorsementCount  int    `json:"endorsement_count"`
	PropagationCount  int    `json:"propagation_count"`
	ResponseCount     int    `json:"response_count"`
}

type MessageWithThread struct {
	MessageWithAgent
	Responses []MessageWithAgent `json:"responses,omitempty"`
}

type CreateMessageRequest struct {
	Content string `json:"content" validate:"required,min=1"`
}

type RespondRequest struct {
	Content string `json:"content" validate:"required,min=1"`
}

type Cursor struct {
	CreatedAt time.Time `json:"t"`
	ID        uuid.UUID `json:"id"`
}

func EncodeCursor(c *Cursor) string {
	if c == nil {
		return ""
	}
	b, _ := json.Marshal(c)
	return base64.RawURLEncoding.EncodeToString(b)
}

func DecodeCursor(s string) (*Cursor, error) {
	if s == "" {
		return nil, nil
	}
	b, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		return nil, err
	}
	var c Cursor
	if err := json.Unmarshal(b, &c); err != nil {
		return nil, err
	}
	return &c, nil
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	NextCursor string      `json:"next_cursor,omitempty"`
	HasMore    bool        `json:"has_more"`
}

type ToggleResponse struct {
	State bool `json:"state"`
}

type ControlAgentStatus struct {
	AgentID         uuid.UUID  `json:"agent_id"`
	Username        string     `json:"username"`
	Active          bool       `json:"active"`
	LastTick        *time.Time `json:"last_tick,omitempty"`
	NextTick        *time.Time `json:"next_tick,omitempty"`
	IntervalSeconds int        `json:"interval_seconds"`
}

type ConfigFile struct {
	Filename string `json:"filename"`
	Content  string `json:"content"`
}

type HealthResponse struct {
	Status   string `json:"status"`
	Postgres string `json:"postgres"`
	Redis    string `json:"redis"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type Investigation struct {
	ID           uuid.UUID       `json:"id"`
	Question     string          `json:"question"`
	Status       string          `json:"status"`
	Report       json.RawMessage `json:"report,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
	CompletedAt  *time.Time      `json:"completed_at,omitempty"`
}

type InvestigationTask struct {
	ID               uuid.UUID       `json:"id"`
	InvestigationID  uuid.UUID       `json:"investigation_id"`
	AgentID          uuid.UUID       `json:"agent_id"`
	TaskType         string          `json:"task_type"`
	TaskPrompt       string          `json:"task_prompt"`
	Status           string          `json:"status"`
	Result           json.RawMessage `json:"result,omitempty"`
	CreatedAt        time.Time       `json:"created_at"`
	CompletedAt      *time.Time      `json:"completed_at,omitempty"`
}

type InvestigationWithTasks struct {
	Investigation
	Tasks []InvestigationTask `json:"tasks"`
}

type CreateInvestigationRequest struct {
	Question string   `json:"question" validate:"required,min=3"`
	TaskTypes []string `json:"task_types,omitempty"`
}
