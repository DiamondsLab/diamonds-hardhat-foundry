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
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Create vscode user and add to sudoers
RUN useradd -m -s /bin/bash -u 1000 vscode \
    && echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/vscode \
    && chmod 0440 /etc/sudoers.d/vscode

# Switch to vscode user for Foundry installation
USER vscode

# Install Foundry (Forge, Cast, Anvil, Chisel) for vscode user
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="/home/vscode/.foundry/bin:${PATH}"
RUN /home/vscode/.foundry/bin/foundryup

# Switch back to root for remaining setup
USER root

# Install Yarn 4.x globally using Corepack
RUN corepack enable && corepack prepare yarn@4.10.3 --activate

# Set working directory
WORKDIR /workspace

# Change ownership to vscode user
RUN chown -R vscode:vscode /workspace

# Switch to vscode user as default
USER vscode

# Expose common ports for development
EXPOSE 8545 8546

# Set default shell
SHELL ["/bin/bash", "-c"]

# Keep container running
CMD ["/bin/bash"]
