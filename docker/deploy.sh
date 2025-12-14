#!/bin/bash

# Determine script absolute path and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Ensure we are executing from the project root
cd "$PROJECT_ROOT"

# Configuration
IMAGE_NAME="churchsite"
CONTAINER_NAME="churchsite_server"
# PORT=80 (Used default ports 80 and 443)
DATA_DIR="./church_data"
ADMIN_PASSWORD="admin123admin456"

echo "Deploying Church Website..."
echo "Project Root: $PROJECT_ROOT"

# 1. Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Stopping existing container..."
    docker stop $CONTAINER_NAME
    echo "Removing existing container..."
    docker rm $CONTAINER_NAME
fi

# 2. Build the Docker image
echo "Building Docker image..."
# Context is now guaranteed to be PROJECT_ROOT
docker build -f docker/Dockerfile -t $IMAGE_NAME .

# 3. Create data directory for persistence
mkdir -p $DATA_DIR

# 4. Run the container
echo "Starting updated container..."
# -d: Run in background
# -p: Map host port 80 to container port 8000
# -v: Mount local data directory to /app/data in container
# -e: Set DB_FILE env var to use the mounted volume
# --restart: Always restart if it crashes
docker run -d \
    --name $CONTAINER_NAME \
    -p 80:8000 \
    -v "$PROJECT_ROOT/$DATA_DIR:/app/data" \
    -v "$PROJECT_ROOT/docker/nginx.conf:/etc/nginx/conf.d/default.conf" \
    -v "$PROJECT_ROOT/backups:/app/backups" \
    -e DB_FILE="/app/data/churchdata.db" \
    -e ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
    --restart unless-stopped \
    $IMAGE_NAME

echo "Deployment complete!"
echo "Site is running at http://localhost:80"
echo "Database is persisted in $PROJECT_ROOT/$DATA_DIR/churchdata.db"
echo "Nginx config is mounted from $PROJECT_ROOT/docker/nginx.conf"