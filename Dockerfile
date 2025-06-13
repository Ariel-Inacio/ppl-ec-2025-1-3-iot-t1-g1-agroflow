# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Create app directory in the container
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install --production && npm run build

# Bundle the app source code
COPY . .

# Expose the port your app listens on (e.g., 3000)
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
