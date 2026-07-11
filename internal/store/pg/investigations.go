package pg

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/andy/trokk/internal/model"
)

func CreateInvestigation(ctx context.Context, pool *pgxpool.Pool, question string, taskTypes []string) (*model.InvestigationWithTasks, error) {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	inv := &model.Investigation{}
	err = tx.QueryRow(ctx,
		`INSERT INTO investigations (question, status)
		 VALUES ($1, 'in_progress')
		 RETURNING id, question, status, created_at`,
		question,
	).Scan(&inv.ID, &inv.Question, &inv.Status, &inv.CreatedAt)
	if err != nil {
		return nil, err
	}

	result := &model.InvestigationWithTasks{Investigation: *inv, Tasks: make([]model.InvestigationTask, 0)}

	if len(taskTypes) == 0 {
		taskTypes = []string{"research", "news", "github", "financial", "crypto", "osint", "fact_check", "consensus"}
	}

	for _, taskType := range taskTypes {
		rows, err := tx.Query(ctx,
			`SELECT a.id FROM agents a WHERE a.active = true ORDER BY a.created_at`,
		)
		if err != nil {
			return nil, err
		}

		agentIDs := make([]uuid.UUID, 0)
		for rows.Next() {
			var id uuid.UUID
			if err := rows.Scan(&id); err != nil {
				rows.Close()
				return nil, err
			}
			agentIDs = append(agentIDs, id)
		}
		rows.Close()

		var agentID uuid.UUID
		switch taskType {
		case "research":
			if len(agentIDs) > 0 {
				agentID = agentIDs[0]
			}
		case "news":
			if len(agentIDs) > 1 {
				agentID = agentIDs[1]
			}
		case "github":
			if len(agentIDs) > 2 {
				agentID = agentIDs[2]
			}
		case "financial":
			if len(agentIDs) > 3 {
				agentID = agentIDs[3]
			}
		case "crypto":
			if len(agentIDs) > 4 {
				agentID = agentIDs[4]
			}
		case "osint":
			if len(agentIDs) > 5 {
				agentID = agentIDs[5]
			}
		case "fact_check":
			if len(agentIDs) > 6 {
				agentID = agentIDs[6]
			}
		case "consensus":
			if len(agentIDs) > 7 {
				agentID = agentIDs[7]
			}
		}

		if agentID == uuid.Nil && len(agentIDs) > 0 {
			agentID = agentIDs[len(agentIDs)-1]
		}

		var task model.InvestigationTask
		err = tx.QueryRow(ctx,
			`INSERT INTO investigation_tasks (investigation_id, agent_id, task_type, task_prompt)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, investigation_id, agent_id, task_type, task_prompt, status, created_at`,
			inv.ID, agentID, taskType, "Investigate: "+question,
		).Scan(&task.ID, &task.InvestigationID, &task.AgentID, &task.TaskType, &task.TaskPrompt, &task.Status, &task.CreatedAt)
		if err != nil {
			return nil, err
		}
		result.Tasks = append(result.Tasks, task)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return result, nil
}

func GetInvestigation(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID) (*model.InvestigationWithTasks, error) {
	inv := &model.InvestigationWithTasks{}
	err := pool.QueryRow(ctx,
		`SELECT id, question, status, report, created_at, completed_at
		 FROM investigations WHERE id = $1`, id,
	).Scan(&inv.ID, &inv.Question, &inv.Status, &inv.Report, &inv.CreatedAt, &inv.CompletedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	rows, err := pool.Query(ctx,
		`SELECT id, investigation_id, agent_id, task_type, task_prompt, status, result, created_at, completed_at
		 FROM investigation_tasks WHERE investigation_id = $1
		 ORDER BY created_at`, id,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	inv.Tasks = make([]model.InvestigationTask, 0)
	for rows.Next() {
		var t model.InvestigationTask
		if err := rows.Scan(&t.ID, &t.InvestigationID, &t.AgentID, &t.TaskType, &t.TaskPrompt, &t.Status, &t.Result, &t.CreatedAt, &t.CompletedAt); err != nil {
			return nil, err
		}
		inv.Tasks = append(inv.Tasks, t)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return inv, nil
}

func ListInvestigations(ctx context.Context, pool *pgxpool.Pool, status string, limit, offset int) ([]model.Investigation, int, error) {
	var total int
	countQuery := `SELECT COUNT(*) FROM investigations`
	countArgs := make([]interface{}, 0)

	if status != "" {
		countQuery += ` WHERE status = $1`
		countArgs = append(countArgs, status)
	}

	if err := pool.QueryRow(ctx, countQuery, countArgs...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `SELECT id, question, status, report, created_at, completed_at
		FROM investigations`

	if status != "" {
		query += ` WHERE status = $1`
	}
	query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`

	args := make([]interface{}, 0)
	if status != "" {
		args = append(args, status)
	}
	args = append(args, limit, offset)

	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	investigations := make([]model.Investigation, 0)
	for rows.Next() {
		var inv model.Investigation
		if err := rows.Scan(&inv.ID, &inv.Question, &inv.Status, &inv.Report, &inv.CreatedAt, &inv.CompletedAt); err != nil {
			return nil, 0, err
		}
		investigations = append(investigations, inv)
	}
	return investigations, total, rows.Err()
}

func GetInvestigationTasks(ctx context.Context, pool *pgxpool.Pool, investigationID uuid.UUID, taskStatus string) ([]model.InvestigationTask, error) {
	query := `SELECT id, investigation_id, agent_id, task_type, task_prompt, status, result, created_at, completed_at
		FROM investigation_tasks WHERE investigation_id = $1`
	args := []interface{}{investigationID}

	if taskStatus != "" {
		query += ` AND status = $2`
		args = append(args, taskStatus)
	}
	query += ` ORDER BY created_at`

	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tasks := make([]model.InvestigationTask, 0)
	for rows.Next() {
		var t model.InvestigationTask
		if err := rows.Scan(&t.ID, &t.InvestigationID, &t.AgentID, &t.TaskType, &t.TaskPrompt, &t.Status, &t.Result, &t.CreatedAt, &t.CompletedAt); err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}

func ClaimPendingTask(ctx context.Context, pool *pgxpool.Pool, agentID uuid.UUID, taskType string) (*model.InvestigationTask, error) {
	t := &model.InvestigationTask{}
	err := pool.QueryRow(ctx,
		`UPDATE investigation_tasks
		 SET status = 'running'
		 WHERE id = (
			 SELECT id FROM investigation_tasks
			 WHERE agent_id = $1 AND status = 'pending' AND ($2 = '' OR task_type = $2)
			 ORDER BY created_at
			 LIMIT 1
			 FOR UPDATE SKIP LOCKED
		 )
		 RETURNING id, investigation_id, agent_id, task_type, task_prompt, status, result, created_at, completed_at`,
		agentID, taskType,
	).Scan(&t.ID, &t.InvestigationID, &t.AgentID, &t.TaskType, &t.TaskPrompt, &t.Status, &t.Result, &t.CreatedAt, &t.CompletedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return t, nil
}

func CompleteTask(ctx context.Context, pool *pgxpool.Pool, taskID uuid.UUID, resultJSON []byte) error {
	_, err := pool.Exec(ctx,
		`UPDATE investigation_tasks
		 SET status = 'complete', result = $2, completed_at = now()
		 WHERE id = $1`,
		taskID, resultJSON,
	)
	return err
}

func FailTask(ctx context.Context, pool *pgxpool.Pool, taskID uuid.UUID, errorMsg string) error {
	_, err := pool.Exec(ctx,
		`UPDATE investigation_tasks
		 SET status = 'failed', result = $2, completed_at = now()
		 WHERE id = $1`,
		taskID, []byte(`{"error":"`+errorMsg+`"}`),
	)
	return err
}

func UpdateInvestigationStatus(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID, status string) error {
	query := `UPDATE investigations SET status = $2`
	args := []interface{}{id, status}

	if status == "complete" {
		query += `, completed_at = now()`
	}
	query += ` WHERE id = $1`

	_, err := pool.Exec(ctx, query, args...)
	return err
}

func SetInvestigationReport(ctx context.Context, pool *pgxpool.Pool, id uuid.UUID, report []byte) error {
	_, err := pool.Exec(ctx,
		`UPDATE investigations SET report = $2 WHERE id = $1`,
		id, report,
	)
	return err
}

func CountPendingTasks(ctx context.Context, pool *pgxpool.Pool, investigationID uuid.UUID) (int, error) {
	var count int
	err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM investigation_tasks
		 WHERE investigation_id = $1 AND status IN ('pending', 'running')`,
		investigationID,
	).Scan(&count)
	return count, err
}

func GetActiveInvestigationIDs(ctx context.Context, pool *pgxpool.Pool) ([]uuid.UUID, error) {
	rows, err := pool.Query(ctx,
		`SELECT id FROM investigations WHERE status IN ('in_progress', 'consensus') ORDER BY created_at`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ids := make([]uuid.UUID, 0)
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}
