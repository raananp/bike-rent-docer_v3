# Use official Node.js image as base
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Build the app
RUN npm run build

# Use a lightweight web server to serve the build
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]