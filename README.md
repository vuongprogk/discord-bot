# Discord Bot

A feature-rich Discord bot built with Discord.js, Bun runtime, and PostgreSQL, featuring comprehensive expense tracking, moderation tools, fun commands, and full observability with OpenTelemetry.

## Features

### 💰 Finance & Expense Tracking
- **Private expense tracking** - All financial data is private to each user
- **10 expense categories** - Food, Transport, Housing, Shopping, Healthcare, Entertainment, Bills, Travel, Education, Other
- **Budget management** - Set monthly budgets per category with visual progress bars
- **Comprehensive reports** - View expenses by period (month/year/all-time) with category breakdowns
- **PostgreSQL storage** - Reliable database with connection pooling

### 🛡️ Moderation Commands
- `/clear` - Bulk delete messages
- `/kick` - Remove users from the server
- `/ban` - Permanently ban users
- `/timeout` - Temporarily mute users

### 🎮 Fun Commands
- `/8ball` - Magic 8-ball predictions
- `/roll` - Roll dice
- `/coinflip` - Flip a coin
- `/choose` - Choose between options
- `/dadjoke` - Get random dad jokes
- `/rate` - Rate anything 0-10
- `/love` - Calculate love compatibility
- `/reverse` - Reverse text
- `/mock` - mOcKiNg SpOnGeBoB text
- `/say` - Make the bot say something
- `/randomnumber` - Generate random numbers
- `/meme` - Generate memes

### ℹ️ Utility Commands
- `/ping` - Check bot latency
- `/server` - Server information
- `/user` - User information
- `/avatar` - View user avatars
- `/serverinfo` - Detailed server stats
- `/help` - Command list

### 📊 Observability
- **Winston logging** - Structured logging with context
- **OpenTelemetry integration** - Traces, metrics, and logs exported to OTEL collector
- **gRPC exporters** - High-performance data export

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) v1.2.23 or higher
- [PostgreSQL](https://www.postgresql.org/) v12 or higher
- Discord Bot Token from [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

1. Clone the repository:
```bash
git clone https://gitlab.com/personal-ace/discord-bot.git
cd discord-bot
```

2. Install dependencies:
```bash
bun install
```

3. Set up PostgreSQL database:
```bash
# Create database
psql -U postgres -c "CREATE DATABASE discord_bot;"
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

Required environment variables:
- `DISCORD_TOKEN` - Your Discord bot token
- `DISCORD_CLIENT_ID` - Your Discord application ID
- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: discord_bot)
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `OTEL_ENDPOINT` - OpenTelemetry collector endpoint (optional)

5. Deploy commands to Discord:
```bash
bun run deploy-commands.js
```

6. Start the bot:
```bash
bun run index.ts
```

## Expense Tracker Usage

All expense commands are **completely private** - responses are only visible to you (ephemeral messages).

### Adding Expenses
```
/expense-add amount:50 category:food description:Lunch at restaurant
```

### Viewing Expenses
```
/expense-list limit:10
```

### Budget Management
```
# Set a monthly budget
/budget-set category:food amount:500

# Check all budgets
/budget-status
```

### Expense Summary
```
# View summary for different periods
/expense-summary period:month
/expense-summary period:year
/expense-summary period:all
```

### Deleting Expenses
```
/expense-delete id:123
```

## Docker Support

### Build Image
```bash
docker build -t discord-bot .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

The Dockerfile uses BuildKit cache mounts for fast rebuilds (5-8s cached builds vs 60s+ fresh builds).

## CI/CD Pipeline

GitLab CI/CD pipeline includes:
1. **Build stage** - BuildKit with registry caching
2. **Security scan** - Trivy vulnerability scanning
3. **Deploy stage** - Kubernetes deployment with kubectl

### Pipeline Optimizations
- Registry-based Docker layer caching
- Trivy cache for security scans
- Parallel job execution
- BuildKit with compression (zstd)

## Development

### Project Structure
```
discord-bot/
├── commands/
│   ├── finance/          # Expense tracker commands
│   ├── fun/              # Entertainment commands
│   ├── moderation/       # Admin commands
│   └── info/             # Utility commands
├── database.ts           # PostgreSQL service layer
├── logger.ts             # Winston logging with OTEL
├── instrumentation.ts    # OpenTelemetry SDK setup
├── index.ts              # Bot entry point
├── Dockerfile            # Optimized container build
└── .gitlab-ci.yml        # CI/CD pipeline

```

### Adding New Commands
1. Create a `.js` file in the appropriate `commands/` subfolder
2. Export an object with `data` (SlashCommandBuilder) and `execute` function
3. Use `MessageFlags.Ephemeral` for private responses
4. Run `bun run deploy-commands.js` to register

### Database Schema
The expense tracker uses two main tables:
- `expenses` - Stores individual expense records
- `budgets` - Stores user budget configurations

Tables include proper indexes on `(user_id, guild_id)` and `created_at` for performance.

## Tech Stack

- **Runtime**: Bun v1.2.23
- **Framework**: Discord.js v14.23.2
- **Database**: PostgreSQL with pg v8.16.3
- **Logging**: Winston v3.18.3
- **Observability**: OpenTelemetry suite (traces, metrics, logs)
- **Container**: Docker with BuildKit
- **CI/CD**: GitLab CI with Trivy security scanning
- **Deployment**: Kubernetes

## License

MIT

## Project Status

Active development. Currently adding more financial features and analytics capabilities.
