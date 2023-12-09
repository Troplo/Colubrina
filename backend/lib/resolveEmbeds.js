const { Message } = require("../models")
const axios = require("axios")
const ogs = require("open-graph-scraper")
const cryptoRandomString = require("crypto-random-string")
const blacklist = require("./blacklist.json")
module.exports = async function (message) {
  return new Promise(async (resolve, reject) => {
    try {
      if (message.content) {
        const regex = /(https?:\/\/\S+)/g
        let links = message.content.match(regex)
        if (links) {
          if (links.length > 3) links = links.slice(0, 3)
          const promises = links.map(async (embedLink, i) => {
            let embed = {}
            const linkURL = new URL(embedLink)
            if (blacklist.includes(linkURL.hostname)) {
              console.log(`Blacklisted link ${linkURL.hostname}`)
              return {
                embedLink,
                openGraph: {
                  ogDescription:
                    "This link cannot be mediaproxied at this time.",
                  ogTitle: "Blacklisted link"
                },
                type: "openGraph"
              }
            }
            await ogs({
              headers: {
                "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)"
              },
              url: embedLink
            })
              .then((result) => {
                if (result?.result) {
                  embed = {
                    embedLink,
                    openGraph: result.result,
                    type: "openGraph"
                  }
                }
              })
              .catch(async () => {
                await axios
                  .get(embedLink, {
                    headers: {
                      "user-agent":
                        "Googlebot/2.1 (+http://www.google.com/bot.html)"
                    }
                  })
                  .then((res) => {
                    // If content type is image
                    if (res.headers["content-type"].startsWith("image/")) {
                      const securityToken = cryptoRandomString({ length: 32 })
                      embed = {
                        type: "image",
                        link: embedLink,
                        securityToken,
                        mediaProxyLink:
                          "/api/v1/mediaproxy/" +
                          message.id +
                          "/" +
                          i +
                          "/" +
                          securityToken
                      }
                    }
                  })
                  .catch((e) => {
                    console.log(e)
                  })
              })
            return embed
          })
          const embeds = await Promise.all(promises)
          await Message.update(
            {
              embeds
            },
            {
              where: {
                id: message.id
              }
            }
          )
          resolve(embeds)
        } else {
          reject()
        }
      } else {
        reject()
      }
    } catch (e) {
      console.log(e)
    }
  })
}
