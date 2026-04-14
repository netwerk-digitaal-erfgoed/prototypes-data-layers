ARG NODE_VERSION=24.14.1

# Example: https://turborepo.dev/docs/guides/tools/docker
FROM node:${NODE_VERSION} AS base

WORKDIR /app

########################################

FROM base AS prepare

RUN npm install turbo --global

# Copy app source
COPY . .

RUN turbo prune @repo/valeros-cli --docker

########################################

FROM base AS builder

# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .

RUN npm install --no-progress

# Build the project
COPY --from=prepare /app/out/full/ .

RUN npm run build --filter=@repo/valeros-cli

########################################

FROM eclipse-temurin:21-jre

# Built-in variable from Docker's BuildKit, e.g. `arm64`
ARG TARGETARCH

WORKDIR /app

# Install Jena
ARG JENA_VERSION=6.0.0
ENV JENA_HOME=/usr/local/bin/jena
ENV PATH=$PATH:$JENA_HOME/bin

# Releases: https://archive.apache.org/dist/jena/binaries/?C=M;O=D
RUN wget -q https://archive.apache.org/dist/jena/binaries/apache-jena-${JENA_VERSION}.tar.gz -O /tmp/jena.tar.gz && \
    tar -xzf /tmp/jena.tar.gz -C /tmp && \
    mkdir -p ${JENA_HOME} && \
    mv /tmp/apache-jena-${JENA_VERSION}/* ${JENA_HOME} && \
    rm -rf /tmp/apache-jena-6.0.0 && \
    rm /tmp/jena.tar.gz

# Install Node
ARG NODE_VERSION
ENV NODE_HOME=/usr/local/bin/nodejs
ENV PATH=$PATH:$NODE_HOME/bin

RUN wget -q https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${TARGETARCH}.tar.gz -O /tmp/node.tar.gz && \
    tar -xzf /tmp/node.tar.gz -C /tmp && \
    mkdir -p ${NODE_HOME} && \
    mv /tmp/node-v${NODE_VERSION}-linux-${TARGETARCH}/* ${NODE_HOME} && \
    rm -rf /tmp/node-v${NODE_VERSION}-linux-${TARGETARCH} && \
    rm /tmp/node.tar.gz

COPY --from=builder /app/apps/valeros-cli/dist .
COPY --from=builder /app/apps/valeros-cli/scripts .
COPY --from=builder /app/apps/valeros-cli/queries ./queries

CMD ["bash"]
