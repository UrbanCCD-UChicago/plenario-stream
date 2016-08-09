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

# supply AWS credentials and DB info
# ENV AWS_ACCESS_KEY_ID=
# ENV AWS_SECRET_ACCESS_KEY=
#
# ENV DB_USER
# ENV DB_PASSWORD=
# ENV DB_HOST=
# ENV DB_PORT=
# ENV DB_NAME=
#
# ENV RS_USER
# ENV RS_PASSWORD=
# ENV RS_HOST=
# ENV RS_PORT=
# ENV RS_NAME=

EXPOSE 80

CMD ["npm", "start"]

