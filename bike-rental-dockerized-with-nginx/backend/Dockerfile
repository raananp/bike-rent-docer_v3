FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install multer multer-s3 cors @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
RUN npm install bcrypt jsonwebtoken jwt-decode
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]