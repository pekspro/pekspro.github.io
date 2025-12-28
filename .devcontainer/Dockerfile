# Jekyll dev container
ARG VARIANT="3.1"
FROM mcr.microsoft.com/devcontainers/ruby:${VARIANT}

# Ensure bundler is present; many images include it but this is safe
 RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       git \
    && rm -rf /var/lib/apt/lists/*

# Default workdir is set by devcontainers; no explicit CMD so VS Code controls lifecycle
