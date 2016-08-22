FROM java:7-jre

RUN apt-get update
RUN apt-get --purge remove node
RUN apt-get --purge remove nodejs-legacy
RUN apt-get --purge remove nodejs
RUN apt-get install -y nodejs-legacy npm git

# creating a directory allows nodejs to find package.json
RUN mkdir -p /app
WORKDIR /app

COPY package.json /app
RUN npm install

COPY . /app

EXPOSE 80

CMD ["npm", "start"]

