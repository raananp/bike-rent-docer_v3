#!/bin/bash
# Install Docker
apt-get update
apt-get install -y docker.io docker-compose git

# Clone the project repo
cd /opt
git clone https://github.com/your-org/bike-rental-docker-main.git
cd bike-rental-docker-main

# Start containers
docker-compose up -d