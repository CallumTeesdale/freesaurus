FROM node:18-alpine as builder

WORKDIR /app


COPY package.json package-lock.json ./
RUN npm ci


COPY . .


ENV NODE_ENV=production


RUN npm run build


FROM nginx:alpine


COPY --from=builder /app/dist /usr/share/nginx/html


COPY nginx.conf /etc/nginx/conf.d/default.conf


RUN echo "window.env = {};" > /usr/share/nginx/html/env-config.js


RUN echo $'\n\
#!/bin/sh\n\
# Update environment variables at runtime\n\
envsubst < /usr/share/nginx/html/env-config.template.js > /usr/share/nginx/html/env-config.js\n\
exec "$@"\n\
' > /docker-entrypoint.d/40-env-config.sh \
&& chmod +x /docker-entrypoint.d/40-env-config.sh


RUN echo $'window.env = {\n\
  "REACT_APP_API_URL": "${REACT_APP_API_URL:-\'/api\'}",\n\
};\n\
' > /usr/share/nginx/html/env-config.template.js


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]