# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /srv/douglas

# Copy main package files for caching
COPY package*.json ./
# Copy the client package files for caching
COPY client/package*.json client/

# Install main dependencies (production only)
RUN npm install --production

# Now copy the rest of the app (including client directory)
COPY . .

# Run the build (which runs build:client and possibly other build processes)
RUN npm run build

# Expose the port your app listens on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
