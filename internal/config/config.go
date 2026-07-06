package config

import (
	"fmt"

	"github.com/caarlos0/env/v11"
)

type Config struct {
	DatabaseURL string `env:"DATABASE_URL,required"`
	RedisURL    string `env:"REDIS_URL" envDefault:"redis://localhost:6379/0"`
	AdminAPIKey string `env:"ADMIN_API_KEY,required"`
	Port        int    `env:"PORT" envDefault:"8080"`
	ConfigDir   string `env:"CONFIG_DIR" envDefault:"./configs/agents"`
	LogLevel    string `env:"LOG_LEVEL" envDefault:"info"`
}

func Load() (*Config, error) {
	cfg := &Config{}
	if err := env.Parse(cfg); err != nil {
		return nil, fmt.Errorf("config: %w", err)
	}
	return cfg, nil
}
