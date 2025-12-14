# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install Python dependencies
RUN pip install --no-cache-dir flask

# Create volume for persistent SQLite database
VOLUME /app/data

# Make sure the server knows where to look for the DB if we change paths
# For now, server.py uses local directory, so we just persist the file (churchdata.db)
# We might need to ensure churchdata.db is writable. 

# Install Nginx
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

# Copy Nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Expose ports
EXPOSE 8000

# Run startup script
CMD ["/start.sh"]
