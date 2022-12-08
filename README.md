# Colourbrina

![Wakatime](https://wakatime.troplo.com/api/badge/Troplo/interval:any/project:Colourbrina?label=wakatime)

You can try a public instance of Colourbrina at [Colourbrina.troplo.com](https://Colourbrina.troplo.com/).

This is currently beta software, and may not work as expected. Please file an issue if you encounter any.

Colourbrina is a simple self-hostable chatting platform written in Vue, and Vuetify for the frontend, and Node.js, Sequelize and Socket.io for the backend.

### Checklist
- [x] Messaging
- [x] Authentication
- [x] Admin panel
- [x] CLI
- [x] (partially complete) Scroll up to see more messages/jump to searched message
- [x] User profile cards
- [x] Group creation and modification
- [x] Direct message groups
- [x] Friending
- [x] Searching
- [x] Friend nicknames
- [x] Embeds & MediaProxy
- [ ] Clean-up/refactor code
- [x] Mobile responsiveness/compatibility
- [x] Email verification
- [ ] Password resetting
- [x] Channel message pins
- [x] Read receipts

<img src="https://i.troplo.com/i/cb08c414644d.png" alt="Chat" width="45%"></img>
<img src="https://i.troplo.com/i/9e5beb241d19.png" alt="Friends" width="45%"></img>
<img src="https://i.troplo.com/i/a0459cbfd312.png" alt="Chat with AMOLED theme" width="45%"></img>
<img src="https://i.troplo.com/i/48f5e875d455.png" alt="Chat with profile card and light theme" width="45%"></img>
## Backend setup
First, configure a database and user (MariaDB strongly recommended) for Colourbrina.<br>
Please navigate to the `backend` folder and run `yarn`.<br>

Then navigate to the `cli` folder, and run the following commands:

```
yarn
```
to install dependencies, and then
```
node .
```
which should result in an interactive CLI prompt looking like the following:
```
Troplo/Colourbrina CLI
Colourbrina version 1.0.1
Failed to check for updates, ensure you are connected to the internet, and services.troplo.com is whitelisted behind any potential firewalls.
? Please select an option (Use arrow keys)
❯ Setup 
  Create user 
  Run migrations 
  Update/create config file 
  Check for updates 
  Build frontend for production 
  Exit
```
Select setup, and go through the steps.<br>After completing the initial setup, you may run `yarn build` in the frontend folder, or select "Build frontend for production" in the CLI.<br>
The backend service can now be started with `node .` in the `backend` folder which will run on port `23998`.

A systemd service example config file can be found at `Colourbrina.service`, and an `nginx.conf` example.
## Frontend setup

Rename .env.example to .env and fill it out with your own information.

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn serve
```

### Compiles and minifies for production

```
yarn build
```

### Lints and fixes files

```
yarn lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

#### View the Colourbrina license in the LICENSE file.
