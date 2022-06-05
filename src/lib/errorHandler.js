module.exports = function (vuex) {
  return function (res, ignorePathErrorCb) {
    let errors = []

    if (res.response === undefined || res.response.data.errors === undefined) {
      if (res.response.status === 429) {
        vuex._vm.$toast.error(
          "You are being rate limited, retry in " +
            res.response.headers["ratelimit-reset"] +
            " seconds."
        )
      } else {
        errors.push("An unknown error occurred. Please try again later.")
      }
    } else {
      res.response.data.errors.forEach((error) => {
        let path = error.path

        if (path && ignorePathErrorCb) {
          ignorePathErrorCb(error, errors)
          return
        }
        errors.push(error.message[0].toUpperCase() + error.message.slice(1))
      })
    }
    if (errors.length) {
      errors.forEach((error) => {
        console.log(error.toString())
        vuex._vm.$toast(error.toString(), {
          timeout: 3000,
          type: "error"
        })
      })
    }
  }
}
