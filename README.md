# GoBarber
REST API made with nodeJS and express

# Instalting dependences Docker


sudo docker run --name database -e POSTGRES_PASSWORD=docker -p 5432:5432 -d postgres

sudo docker run --name redis-barber -p 6379:6379 -d -t redis:alpine

sudo docker run --name mongobarber -p 27017:27017 -d -t mongo


# npm dependences

yarn or npm install
