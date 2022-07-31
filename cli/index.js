const input = require("input")
const fs = require("fs")
const path = require("path")
const { Umzug, SequelizeStorage } = require("umzug")
const { Sequelize } = require("sequelize")
const argon2 = require("argon2")
const axios = require("axios")
const os = require("os")
const { execSync } = require("child_process")

console.log("Troplo/Colubrina CLI")
console.log("Colubrina version", require("../frontend/package.json").version)
async function checkForUpdates() {
  if (!process.argv.includes("--skip-update")) {
    await axios
      .get("https://services.troplo.com/api/v1/state", {
        headers: {
          "X-Troplo-Project": "colubrina",
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
          console.log("A new version of Colubrina is available!")
          console.log("Latest version:", res.data.latestVersion)
        } else {
          console.log("Colubrina is up to date.")
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
    username: "colubrina",
    password: null,
    database: "colubrina",
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
    default: state.db.username || "colubrina"
  })
  const password = await input.text("What is the password?", {
    default: state.db.password ? "Enter for cached password" : "Please specify"
  })
  const database = await input.text("What is the database name?", {
    default: state.db.database || "colubrina"
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
    path.join(__dirname, "../backend/config/config.json"),
    JSON.stringify(state.dbConfig)
  )
  console.log("config/config.json overwritten")
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
  function setEnvValue(key, value) {
    const ENV_VARS = fs.readFileSync("../backend/.env", "utf8").split(os.EOL)

    // find the env we want based on the key
    const target = ENV_VARS.indexOf(
      ENV_VARS.find((line) => {
        // (?<!#\s*)   Negative lookbehind to avoid matching comments (lines that starts with #).
        //             There is a double slash in the RegExp constructor to escape it.
        // (?==)       Positive lookahead to check if there is an equal sign right after the key.
        //             This is to prevent matching keys prefixed with the key of the env var to update.
        const keyValRegex = new RegExp(`(?<!#\\s*)${key}(?==)`)

        return line.match(keyValRegex)
      })
    )

    // if key-value pair exists in the .env file,
    if (target !== -1) {
      // replace the key/value with the new value
      ENV_VARS.splice(target, 1, `${key}=${value}`)
    } else {
      // if it doesn't exist, add it instead
      ENV_VARS.push(`${key}=${value}`)
    }

    // write everything back to the file system
    fs.writeFileSync("../backend/.env", ENV_VARS.join(os.EOL))
  }
  if (!fs.existsSync("../backend/.env")) {
    fs.writeFileSync("../backend/.env", "")
  }
  setEnvValue(
    "HOSTNAME",
    await input.text("Public Domain", {
      default: "localhost"
    })
  )
  setEnvValue(
    "CORS_HOSTNAME",
    await input.text("Public Hostname", {
      default: "http://localhost:8080"
    })
  )
  setEnvValue(
    "SITE_NAME",
    await input.text("Site Name", {
      default: "Colubrina"
    })
  )
  setEnvValue(
    "ALLOW_REGISTRATIONS",
    await input.text("Permit Public Registrations", {
      default: false
    })
  )
  setEnvValue(
    "PUBLIC_USERS",
    await input.text("Show instance users publicly", {
      default: false
    })
  )
  const emailVerify = await input.text("Enforce email verification?", {
    default: false
  })
  if (emailVerify) {
    setEnvValue("EMAIL_VERIFICATION", true)
    setEnvValue(
      "EMAIL_SMTP_HOST",
      await input.text("SMTP Host", {
        default: "smtp.myhost.com"
      })
    )
    setEnvValue(
      "EMAIL_SMTP_PORT",
      await input.text("SMTP Port", {
        default: 587
      })
    )
    setEnvValue(
      "EMAIL_SMTP_USER",
      await input.text("SMTP User", {
        default: "colubrina@myhost.com"
      })
    )
    setEnvValue(
      "EMAIL_SMTP_FROM",
      await input.text("SMTP From Address", {
        default: "colubrina@myhost.com"
      })
    )
    setEnvValue("EMAIL_SMTP_PASSWORD", await input.text("SMTP Password", {}))
    setEnvValue(
      "EMAIL_SMTP_SECURE",
      await input.text("SMTP Secure", {
        default: false
      })
    )
  } else {
    setEnvValue("EMAIL_VERIFICATION", false)
    setEnvValue("EMAIL_SMTP_HOST", "smtp.myhost.com")
    setEnvValue("EMAIL_SMTP_PORT", "587")
    setEnvValue("EMAIL_SMTP_USER", "colubrina@myhost.com")
    setEnvValue("EMAIL_SMTP_FROM", "colubrina@myhost.com")
    setEnvValue("EMAIL_SMTP_PASSWORD", "myPassword")
    setEnvValue("EMAIL_SMTP_SECURE", false)
  }
  setEnvValue("PUBLIC_USERS")
  setEnvValue("NOTIFICATION", "")
  setEnvValue("NOTIFICATION_TYPE", "info")
  setEnvValue("RELEASE", "stable")
}
async function init() {
  while (true) {
    const option = await input.select(`Please select an option`, [
      "First-time setup",
      "Create user",
      "Run migrations",
      "Update/create config file",
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
      if (fs.existsSync(path.join(__dirname, "../backend/.env"))) {
        const option = await input.confirm(".env already exists, overwrite?", {
          default: false
        })
        if (option) {
          await configureDotEnv()
        }
      } else {
        await configureDotEnv()
      }
      if (
        fs.existsSync(path.join(__dirname, "../backend/config/config.json"))
      ) {
        const option = await input.select(
          `config/config.json already exists. Do you want to overwrite it?`,
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
          username: "Colubrina",
          id: 0,
          bot: true,
          email: "colubrina@troplo.com",
          banned: true
        })
        await User.update(
          {
            id: 0
          },
          {
            where: {
              username: "Colubrina"
            }
          }
        )
      } catch {
        console.log("System user already exists.")
      }
      console.log("DB templates applied")
      console.log("Admin user creation")
      await createUser()
      console.log("Colubrina has been setup.")
      console.log(
        "Colubrina can be started with `yarn serve` or `node .` in the backend directory."
      )
      console.log(
        "The Colubrina frontend can be built with `yarn build` in the root project directory, and is recommended to be served via NGINX, with a proxy_pass to the backend on /api and /socket.io."
      )
    } else if (option === "Update/create config file") {
      await dbSetup()
      console.log("config/config.json overwritten or created")
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
