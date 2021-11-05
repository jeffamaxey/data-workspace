FROM postgres:10.4

COPY /entrypoint.sh /
COPY /2-init-databases.sql /docker-entrypoint-initdb.d/

ENTRYPOINT /entrypoint.sh
