# Dockerfile
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Build TypeScript (opcional si no usas ts-node directamente)
# RUN npm run build

# Expose the port
EXPOSE 4001

# Run the app in development
CMD ["npm", "run", "dev"]
