ARG NODE_VERSION=24.14.1

#######################################################
# Build the Sophia CLI
#######################################################

FROM rust:bookworm AS sophia-cli-builder

WORKDIR /app

# Full SHA of commit - see https://github.com/pchampin/sophia-cli/commits/main/
# Sophia currently does not have releases, e.g. with version numbers.
ARG SOPHIA_CLI_VERSION="04085445c3ecbbfb86a308c830705ee52eb1d07f"

# Fetch and build the source code of sophia-cli
RUN git init && \
    git remote add origin https://github.com/pchampin/sophia-cli.git && \
    git fetch --depth 1 origin "${SOPHIA_CLI_VERSION}" && \
    git checkout FETCH_HEAD && \
    rm -rf .git && \
    cargo build --release

#######################################################
# Build the Valeros CLI
#######################################################

# Example: https://turborepo.dev/docs/guides/tools/docker
FROM node:${NODE_VERSION} AS valeros-cli-base

WORKDIR /app

########################################

FROM valeros-cli-base AS valeros-cli-prepare

RUN npm install turbo --global

# Copy app source
COPY . .

RUN turbo prune @repo/valeros-cli --docker

########################################

FROM valeros-cli-base AS valeros-cli-builder

# First install the dependencies (as they change less often)
COPY --from=valeros-cli-prepare /app/out/json/ .

RUN npm install --no-progress

# Build the project
COPY --from=valeros-cli-prepare /app/out/full/ .

RUN npm run build --filter=@repo/valeros-cli

########################################
# Build the runtime
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
    rm -rf /tmp/apache-jena-${JENA_VERSION} && \
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

# Copy the files from the builders
COPY --from=sophia-cli-builder /app/target/release/sop /usr/local/bin/sop
COPY --from=valeros-cli-builder /app/apps/valeros-cli/dist .
COPY --from=valeros-cli-builder /app/apps/valeros-cli/scripts .
COPY --from=valeros-cli-builder /app/apps/valeros-cli/queries ./queries

CMD ["bash"]
