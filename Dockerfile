# Use official Node.js LTS image
FROM node:20

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the project files
COPY . .

# Expose the port your app uses
EXPOSE 3000

# Start the app
CMD ["node", "app.js"]
