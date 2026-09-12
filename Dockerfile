FROM nginx:alpine

LABEL org.opencontainers.image.title="DevSystem Portfolio" \
      org.opencontainers.image.description="Portfólio pessoal de Anderson Souza" \
      org.opencontainers.image.source="https://github.com/anderson-souza-tech/portfolio"

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
