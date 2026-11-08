FROM node:22-alpine

WORKDIR /app

# 1. On copie uniquement les fichiers de configuration
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# 2. On installe toutes les dépendances (en pur Linux)
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# 3. On copie le reste du code
COPY . .

EXPOSE 3000
EXPOSE 8080

CMD ["npm", "run", "dev"]