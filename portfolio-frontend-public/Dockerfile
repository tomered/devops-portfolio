# ----------- Build Stage ----------- #
FROM node:18-alpine AS builder
WORKDIR /app

# Accept API URL as build arg
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Install deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy only required files
COPY public ./public
COPY src ./src
COPY index.html ./
COPY vite.config.* ./
COPY tailwind.config.* ./
COPY postcss.config.* ./

# Build the app
RUN npm run build

# ----------- Production Stage ----------- #
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Accept backend URL as build arg (required)
ARG BACKEND_URL

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Copy nginx template and generate config
COPY nginx.template.conf /tmp/nginx.template.conf
RUN BACKEND_URL=$BACKEND_URL envsubst '\$BACKEND_URL' < /tmp/nginx.template.conf > /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Fix nginx write paths and set permissions
RUN mkdir -p /var/cache/nginx /run && \
    chown -R appuser:appgroup /var/cache/nginx /run /usr/share/nginx/html

# Switch to non-root user
USER appuser

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]