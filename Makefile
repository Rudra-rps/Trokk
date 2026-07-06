.PHONY: run build test docker-up docker-down clean

run:
	go run ./cmd/server

build:
	go build -o trokk-server.exe ./cmd/server

test:
	go test ./...

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	rm -f trokk-server.exe
