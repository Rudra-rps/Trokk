@echo off
set DATABASE_URL=postgres://trokk:trokk@127.0.0.1:5432/trokk?sslmode=disable
set REDIS_URL=redis://127.0.0.1:6379/0
set ADMIN_API_KEY=rp_admin
set PORT=8080
set CONFIG_DIR=.\configs\agents
set LOG_LEVEL=info
go run .\cmd\server
