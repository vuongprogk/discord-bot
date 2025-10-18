# Advanced Dockerfile with maximum caching optimization
# Use specific version for reproducibility
FROM oven/bun:1.2.23-slim AS base
WORKDIR /usr/src/app

# Environment variables for optimization
ENV NODE_ENV=production \
    BUN_RUNTIME_TRANSPILER_CACHE_PATH=/tmp/bun-cache

# Dependencies stage - heavily cached
FROM base AS deps

# Copy only dependency files for maximum cache hit rate
COPY package.json bun.lock ./
COPY prisma ./prisma/

# Install with cache mount - MUCH faster on rebuilds
# Use --ignore-scripts for security and speed, but run postinstall manually for Prisma
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install \
    --frozen-lockfile \
    --production \
    --ignore-scripts \
    --no-progress \
    --no-summary && \
    bunx prisma generate

# Final stage - minimal production image
FROM base AS release

# Copy production dependencies (includes generated Prisma Client)
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy Prisma files for migrations
COPY --chown=bun:bun prisma ./prisma/

# Copy application files in optimal order (least to most frequently changed)
# Single COPY for static config files
COPY --chown=bun:bun package.json ./

# Core infrastructure files (change infrequently)
COPY --chown=bun:bun instrumentation.ts logger.ts database.ts ./

# Application entry points
COPY --chown=bun:bun index.ts deploy-commands.js ./

# Commands directory (changes most frequently - last for better caching)
COPY --chown=bun:bun commands/ ./commands/

# Create cache directory with proper permissions
RUN mkdir -p /tmp/bun-cache && chown -R bun:bun /tmp/bun-cache

# Health check with better timeout settings
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD bun --version || exit 1

# Run as non-root user
USER bun

# Use exec form for proper signal handling
ENTRYPOINT ["bun", "run", "start"]

