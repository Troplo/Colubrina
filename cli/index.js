const input = require("input")
const fs = require("fs")
const path = require("path")
const { Umzug, SequelizeStorage } = require("umzug")
const { Sequelize } = require("sequelize")
const argon2 = require("argon2")
const axios = require("axios")
const os = require("os")
const { execSync } = require("child_process")

console.log("Troplo/Colourbrina CLI")
if (fs.existsSync("../backend/config/config.json")) {
  console.log(
    "Want to modify either the Colourbrina, or database config? Check out the config files in backend/config."
  )
}
console.log("Colourbrina version", require("../frontend/package.json").version)
async function checkForUpdates() {
  if (!process.argv.includes("--skip-update")) {
    await axios
      .get("https://services.troplo.com/api/v1/state", {
        headers: {
          "X-Troplo-Project": "Colourbrina",
          "X-Troplo-Project-Version": require("../frontend/package.json")
            .version
        },
        timeout: 1000
      })
      .then((res) => {
        if (res.data.warning) {
          console.log(res.data.warning)
        }
        if (
          require("../frontend/package.json").version !== res.data.latestVersion
        ) {
          console.log("A new version of Colourbrina is available!")
          console.log("Latest version:", res.data.latestVersion)
        } else {
          console.log("Colourbrina is up to date.")
        }
      })
      .catch((e) => {
        console.log(e)
        console.log(
          "Failed to check for updates, ensure you are connected to the internet, and services.troplo.com is whitelisted behind any potential firewalls."
        )
      })
  } else {
    console.log("Skipping update check")
  }
}
let state = {
  db: {
    host: "localhost",
    port: 3306,
    username: "Colourbrina",
    password: null,
    database: "Colourbrina",
    storage: "../backend/storage.db",
    dialect: "mariadb"
  },
  dbConfig: {}
}
async function doSetupDB() {
  const dialect = await input.select(
    "What database dialect do you want to use? (MariaDB tested, recommended)",
    ["mariadb", "postgres", "sqlite"]
  )
  const host = await input.text("What is the host?", {
    default: state.db.host || "localhost"
  })
  const port = await input.text("What is the port?", {
    default: state.db.port || 3306
  })
  const username = await input.text("What is the username?", {
    default: state.db.username || "Colourbrina"
  })
  const password = await input.text("What is the password?", {
    default: state.db.password ? "Enter for cached password" : "Please specify"
  })
  const database = await input.text("What is the database name?", {
    default: state.db.database || "Colourbrina"
  })
  let storage
  if (dialect === "sqlite") {
    storage = await input.text(
      "What is the path to the storage file (SQLite only)?",
      {
        default: state.db.storage || "./storage.db"
      }
    )
  }
  state.db = {
    username: username,
    password: password,
    database: database,
    host: host,
    dialect: dialect,
    port: port,
    logging: false
  }
  state.dbConfig = {
    development: {
      username: username,
      password: password,
      database: database,
      host: host,
      dialect: dialect,
      port: port,
      storage: dialect === "sqlite" ? storage : null,
      logging: false
    },
    test: {
      username: username,
      password: password,
      database: database,
      host: host,
      dialect: dialect,
      port: port,
      logging: false
    },
    production: {
      username: username,
      password: password,
      database: database,
      host: host,
      dialect: dialect,
      port: port,
      logging: false
    }
  }
  await testDB()
}
async function testDB() {
  try {
    const sequelize = new Sequelize(state.db)
    await sequelize.authenticate()
    console.log("Connection to database has been established successfully.")
  } catch (error) {
    console.error("Unable to connect to the database:", error)
    await doSetupDB()
  }
}
async function dbSetup() {
  await doSetupDB()
  fs.writeFileSync(
    path.join(__dirname, "../backend/config/database.json"),
    JSON.stringify(state.dbConfig, null, 2)
  )
  console.log("config/database.json overwritten")
}
async function runMigrations() {
  console.log("Running migrations")
  execSync("cd ../backend && sequelize db:migrate", () => {
    console.log("Migrations applied")
  })
}
async function createUser() {
  const user = {
    username: await input.text("Username", {
      default: "admin"
    }),
    password: await argon2.hash(await input.text("Password", {})),
    email: await input.text("Email", {
      default: "troplo@troplo.com"
    }),
    admin: await input.confirm("Admin (true/false)", {
      default: false
    }),
    emailVerified: await input.confirm("Email verified (true/false)", {
      default: true
    })
  }
  const { User } = require("../backend/models")
  await User.create(user)
  console.log("User created")
}
async function configureDotEnv() {
  if (!fs.existsSync("../backend/config/config.json")) {
    fs.writeFileSync("../backend/config/config.json", "{}")
  }
  let config = require("../backend/config/config.json")
  config.hostname = await input.text("Public Domain", {
    default: "localhost"
  })
  config.corsHostname = await input.text("CORS Hostname", {
    default: "http://localhost"
  })
  config.siteName = await input.text("Site Name", {
    default: "Colourbrina"
  })
  config.allowRegistrations = await input.text("Allow Registrations", {
    default: true
  })
  config.publicUsers = await input.text("Show instance users publicly?", {
    default: true
  })
  config.emailVerify = await input.text("Enforce email verification?", {
    default: false
  })
  if (config.emailVerify) {
    config.emailSMTPHost = await input.text("SMTP Host", {
      default: "mail.example.com"
    })
    config.emailSMTPPort = await input.text("SMTP Port", {
      default: 587
    })
    config.emailSMTPUsername = await input.text("SMTP Username", {
      default: "Colourbrina@example.com"
    })
    config.emailSMTPPassword = await input.text("SMTP Password", {})
    config.emailSMTPFrom = await input.text("SMTP From Address", {
      default: "Colourbrina@example.com"
    })
    config.emailSMTPSecure = await input.text("SMTP Secure", {
      default: true
    })
  } else {
    config.emailSMTPHost = "smtp.myhost.com"
    config.emailSMTPPort = 587
    config.emailSMTPUsername = "Colourbrina@example.com"
    config.emailSMTPFrom = "Colourbrina@example.com"
    config.emailSMTPPassword = ""
    config.emailSMTPSecure = true
  }
  config.notification = ""
  config.notificationType = "info"
  config.release = "stable"
  config.rules = "Write your instance rules here."
  fs.writeFileSync(
    "../backend/config/config.json",
    JSON.stringify(config, null, 2)
  )
}
async function init() {
  while (true) {
    const option = await input.select(`Please select an option`, [
      "First-time setup",
      "Create user",
      "Run migrations",
      "Update/create database config file",
      "Check for updates",
      "Build frontend for production",
      "Exit"
    ])

    if (option === "First-time setup") {
      // run yarn install in ../backend
      console.log("Running yarn install")
      execSync("cd ../backend && yarn install --frozen-lockfile", () => {
        console.log("yarn install complete (backend)")
      })
      execSync("cd ../frontend && yarn install --frozen-lockfile", () => {
        console.log("yarn install complete (frontend)")
      })
      if (
        fs.existsSync(path.join(__dirname, "../backend/config/config.json"))
      ) {
        const option = await input.confirm(
          "Colourbrina config already exists, overwrite?",
          {
            default: false
          }
        )
        if (option) {
          await configureDotEnv()
        }
      } else {
        await configureDotEnv()
      }
      if (
        fs.existsSync(path.join(__dirname, "../backend/config/database.json"))
      ) {
        const option = await input.select(
          `config/database.json already exists. Do you want to overwrite it?`,
          ["Yes", "No"]
        )
        if (option === "Yes") {
          await dbSetup()
        }
      } else {
        await dbSetup()
      }
      await runMigrations()
      const { User, Theme } = require("../backend/models")
      try {
        await Theme.bulkCreate(
          JSON.parse(
            fs.readFileSync(path.join(__dirname, "./templates/themes.json"))
          )
        )
      } catch {
        console.log("Themes already exist.")
      }
      try {
        await User.create({
          username: "Colourbrina",
          id: 0,
          bot: true,
          email: "Colourbrina@troplo.com",
          banned: true
        })
        await User.update(
          {
            id: 0
          },
          {
            where: {
              username: "Colourbrina"
            }
          }
        )
      } catch {
        console.log("System user already exists.")
      }
      console.log("DB templates applied")
      console.log("Admin user creation")
      await createUser()
      console.log("Colourbrina has been setup.")
      console.log(
        "Colourbrina can be started with `yarn serve` or `node .` in the backend directory."
      )
      console.log(
        "The Colourbrina frontend can be built with `yarn build` in the root project directory, and is recommended to be served via NGINX, with a proxy_pass to the backend on /api and /socket.io."
      )
    } else if (option === "Update/create database config file") {
      await dbSetup()
      console.log("config/database.json overwritten or created")
    } else if (option === "Create user") {
      await createUser()
    } else if (option === "Run migrations") {
      await runMigrations()
    } else if (option === "Check for updates") {
      await checkForUpdates()
    } else if (option === "Build frontend for production") {
      console.log("Building...")
      execSync(
        "cd ../frontend && yarn install --frozen-lockfile && yarn build",
        () => {
          console.log("yarn build complete")
        }
      )
    } else if (option === "Exit") {
      process.exit(0)
    }
  }
}
checkForUpdates().finally(() => {
  init()
})
