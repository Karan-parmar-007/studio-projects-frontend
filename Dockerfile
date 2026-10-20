FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG VITE_SSO_URL=https://auth.karanparmar.in
ENV VITE_SSO_URL=${VITE_SSO_URL}

RUN npm run build

FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

LABEL org.opencontainers.image.source=https://github.com/Karan-parmar-007/studio-projects-frontend
LABEL org.opencontainers.image.description="Studio frontend for studio.karanparmar.in"

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
