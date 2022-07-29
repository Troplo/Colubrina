# Colubrina Backend
Setup instructions can be found in the root README.md document.
## Manual Setup instructions (not using Colubrina CLI)

- Run `yarn install` to install the dependencies.
- Configure the MariaDB database connection in `config/config.json` using the
  example template `config/config.example.json`.
- Configure `.env` with the template `.env.example`.
- Run `sequelize db:migrate` to create the database tables.
- Run `sequelize db:seed` to seed required information to the database.
- Run `yarn serve` to start the proxy with nodemon which automatically restarts
  on file-change for development.
- Run `yarn start` or `node .` to start the proxy in production.
- Colubrina Backend runs on port 23998.
