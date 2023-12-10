module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true
  },
  extends: ["plugin:vue/recommended", "eslint:recommended"],
  parserOptions: {
    parser: "@babel/eslint-parser"
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "vue/no-parsing-error": [
      "error",
      { "invalid-first-character-of-tag-name": false }
    ],
    "vue/no-reserved-component-names": "off",
    "vue/no-mutating-props": "off",
    "vue/multi-word-component-names": "off",
    "vue/no-v-text-v-html-on-component": "off"
  }
}
