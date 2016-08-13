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
 ENV AWS_ACCESS_KEY_ID=AKIAJM4Q3K3BTYP7FOHA
 ENV AWS_SECRET_ACCESS_KEY=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

 ENV DB_USER=plenario
 ENV DB_PASSWORD=plenario22
 ENV DB_HOST=aot-metadata-test2.c6r1g0x3odle.us-east-1.rds.amazonaws.com
 ENV DB_PORT=5432
 ENV DB_NAME=aotMeta

 ENV RS_USER=plenario
 ENV RS_PASSWORD=Plenario22
 ENV RS_HOST=aot-test.cgsdruid1put.us-east-1.redshift.amazonaws.com
 ENV RS_PORT=5439
 ENV RS_NAME=dev

EXPOSE 80

CMD ["npm", "start"]

