# Use specific version for reproducibility
FROM oven/bun:1.2.23-slim AS base
WORKDIR /usr/src/app

# Install stage - production dependencies only
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Build stage (if needed for future TypeScript compilation)
FROM base AS build
COPY package.json bun.lock ./
COPY --from=install /usr/src/app/node_modules ./node_modules
COPY . .

# Final stage - minimal production image
FROM base AS release

# Copy production dependencies
COPY --from=install /usr/src/app/node_modules ./node_modules

# Copy application files
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
