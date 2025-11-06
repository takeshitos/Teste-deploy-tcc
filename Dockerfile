# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and bun.lockb (or package-lock.json if npm is used)
# to leverage Docker cache for dependencies
COPY package.json bun.lockb ./

# Install dependencies
# Using npm install as per README.md, even if bun.lockb is present
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React application
RUN npm run build

# Stage 2: Serve the built application with a lightweight web server
FROM node:20-alpine AS runner

WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Install 'serve' globally to serve the static files
RUN npm install -g serve

# Expose the port the application will run on
EXPOSE 3000

# Command to run the application
CMD ["serve", "-s", "dist", "-l", "3000"]