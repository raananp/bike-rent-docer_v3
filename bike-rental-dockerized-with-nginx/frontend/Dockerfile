# Use official Node.js image as base
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install
RUN npm install @mui/icons-material@5.11.0
#RUN npm install axios jwt-decode@3.1.2 react-swipeable-views
RUN npm install axios jwt-decode@3.1.2 react-swipeable-views @mui/x-date-pickers@^6.19.7 date-fns@^2 --legacy-peer-deps


# Copy rest of the app
COPY . .

# Build the app
RUN npm run build

# Use a lightweight web server to serve the build
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]
