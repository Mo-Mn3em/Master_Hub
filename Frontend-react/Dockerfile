#  Frontend — Node + Vite dev server

FROM node:20-alpine

# Set working directory
WORKDIR /app/frontend

# Copy package files first (layer caching)
COPY package.json package-lock.json* ./

# Install all Node dependencies
RUN npm install

# Copy the rest of the frontend source
COPY . .

EXPOSE 5173

# Run Vite dev server, listening on all interfaces so Docker can expose it
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
