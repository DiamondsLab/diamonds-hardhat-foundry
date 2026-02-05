# Use official Node.js 20 base image
FROM node:20-bookworm

# Install system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    curl \
    wget \
    ca-certificates \
    gnupg \
    build-essential \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Foundry (Forge, Cast, Anvil, Chisel)
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/root/.foundry/bin:${PATH}"
RUN foundryup

# Install Yarn 4.x globally using Corepack
RUN corepack enable && corepack prepare yarn@4.10.3 --activate

# Set working directory
WORKDIR /workspace

# Expose common ports for development
EXPOSE 8545 8546

# Set default shell
SHELL ["/bin/bash", "-c"]

# Keep container running
CMD ["/bin/bash"]
