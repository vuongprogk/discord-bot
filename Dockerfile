# Advanced Dockerfile with maximum caching optimization
# Use specific version for reproducibility
FROM oven/bun:1.2.23-slim AS base
WORKDIR /usr/src/app

# Dependencies stage - heavily cached
FROM base AS deps

# Enable BuildKit cache mount for bun install
RUN --mount=type=cache,target=/root/.bun/install/cache \
    mkdir -p /root/.bun/install/cache

# Copy only dependency files for maximum cache hit rate
COPY package.json bun.lock ./

# Install with cache mount - MUCH faster on rebuilds
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install \
    --frozen-lockfile \
    --production \
    --no-progress \
    --no-summary

# Final stage - minimal production image
FROM base AS release

# Copy production dependencies
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy application files (these change more often)
COPY --chown=bun:bun package.json ./
COPY --chown=bun:bun index.ts ./
COPY --chown=bun:bun instrumentation.ts ./
COPY --chown=bun:bun logger.ts ./
COPY --chown=bun:bun deploy-commands.js ./
COPY --chown=bun:bun commands/ ./commands/

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun --version || exit 1

# Run as non-root user
USER bun

# Use exec form for proper signal handling
ENTRYPOINT ["bun", "run", "start"]
