FROM node:20-alpine

WORKDIR /app/apps/web

COPY apps/web/package.json ./package.json
RUN npm install

COPY apps/web ./

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
