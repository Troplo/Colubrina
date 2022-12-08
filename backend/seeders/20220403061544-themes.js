"use strict"

module.exports = {
  up: async (queryInterface) =>
    queryInterface.bulkInsert(
      "Themes",
      [
        {
          id: 1,
          name: "Colourbrina Classic",
          userId: 1,
          public: true,
          theme: {
            id: 1,
            name: "Colourbrina Classic",
            primaryType: "all",
            dark: {
              primary: "#0190ea",
              secondary: "#757575",
              accent: "#000000",
              error: "#ff1744",
              info: "#2196F3",
              success: "#4CAF50",
              warning: "#ff9800",
              card: "#151515",
              toolbar: "#191919",
              sheet: "#181818",
              text: "#000000",
              dark: "#151515",
              bg: "#151515"
            },
            light: {
              primary: "#0190ea",
              secondary: "#757575",
              accent: "#000000",
              error: "#ff1744",
              info: "#2196F3",
              success: "#4CAF50",
              warning: "#ff9800",
              card: "#f8f8f8",
              toolbar: "#f8f8f8",
              sheet: "#f8f8f8",
              text: "#000000",
              dark: "#f8f8f8",
              bg: "#f8f8f8"
            }
          },
          createdAt: "2022-03-26 23:23:29",
          updatedAt: "2022-03-26 23:23:29"
        },
        {
          id: 2,
          name: "Colourbrina Gray",
          userId: 1,
          public: true,
          theme: {
            id: 2,
            name: "Colourbrina Gray",
            primaryType: "all",
            user: {
              sussiId: "asdasd"
            },
            dark: {
              primary: "#0190ea",
              secondary: "#757575",
              accent: "#000000",
              error: "#ff1744",
              info: "#2196F3",
              success: "#4CAF50",
              warning: "#ff9800",
              card: "#262626",
              toolbar: "#262626",
              sheet: "#262626",
              text: "#000000",
              dark: "#262626",
              bg: "#191919"
            },
            light: {
              primary: "#0190ea",
              secondary: "#757575",
              accent: "#000000",
              error: "#ff1744",
              info: "#2196F3",
              success: "#4CAF50",
              warning: "#ff9800",
              card: "#dedede",
              toolbar: "#dedede",
              sheet: "#dedede",
              text: "#000000",
              dark: "#dedede",
              bg: "#e7e7e7"
            }
          },
          createdAt: "2022-03-26 23:25:12",
          updatedAt: "2022-03-26 23:25:12"
        },
        {
          id: 3,
          name: "Colourbrina AMOLED (Black)",
          userId: 1,
          public: true,
          theme: {
            id: 3,
            name: "Colourbrina AMOLED",
            primaryType: "dark",
            dark: {
              primary: "#0190ea",
              secondary: "#757575",
              accent: "#000000",
              error: "#ff1744",
              info: "#2196F3",
              success: "#4CAF50",
              warning: "#ff9800",
              card: "#000000",
              toolbar: "#121212",
              sheet: "#000000",
              text: "#000000",
              dark: "#000000",
              bg: "#000000"
            },
            light: {
              primary: "#0190ea",
              secondary: "#757575",
              accent: "#000000",
              error: "#ff1744",
              info: "#2196F3",
              success: "#4CAF50",
              warning: "#ff9800",
              card: "#f8f8f8",
              toolbar: "#f8f8f8",
              sheet: "#f8f8f8",
              text: "#000000",
              dark: "#f8f8f8"
            }
          },
          createdAt: "2022-03-26 23:25:12",
          updatedAt: "2022-03-26 23:25:12"
        },
        {
          id: 4,
          name: "Colourbrina Grayscale",
          userId: 1,
          public: true,
          theme: {
            id: 5,
            name: "Colourbrina Grayscale",
            primaryType: "all",
            dark: {
              primary: "#6E6E6E",
              secondary: "#757575",
              accent: "#000000",
              error: "#616161",
              info: "#7D7D7D",
              success: "#868686",
              warning: "#A6A6A6",
              card: "#151515",
              toolbar: "#191919",
              sheet: "#181818",
              text: "#000000",
              dark: "#151515",
              bg: "#151515"
            },
            light: {
              primary: "#6E6E6E",
              secondary: "#757575",
              accent: "#000000",
              error: "#616161",
              info: "#7D7D7D",
              success: "#868686",
              warning: "#A6A6A6",
              card: "#f8f8f8",
              toolbar: "#f8f8f8",
              sheet: "#f8f8f8",
              text: "#000000",
              dark: "#f8f8f8",
              bg: "#f8f8f8"
            }
          },
          createdAt: "2022-03-26 23:25:12",
          updatedAt: "2022-03-26 23:25:12"
        },
        {
          id: 5,
          name: "Colourbrina High Contrast",
          userId: 1,
          public: true,
          theme: {
            id: 6,
            name: "Colourbrina High Contrast",
            primaryType: "all",
            dark: {
              primary: "#0057E9",
              secondary: "#757575",
              accent: "#000000",
              error: "#E11845",
              info: "#0057E9",
              success: "#87E911",
              warning: "#F2CA19",
              card: "#151515",
              toolbar: "#191919",
              sheet: "#181818",
              text: "#000000",
              dark: "#151515",
              bg: "#151515"
            },
            light: {
              primary: "#0057E9",
              secondary: "#757575",
              accent: "#000000",
              error: "#E11845",
              info: "#0057E9",
              success: "#87E911",
              warning: "#F2CA19",
              card: "#f8f8f8",
              toolbar: "#f8f8f8",
              sheet: "#f8f8f8",
              text: "#000000",
              dark: "#f8f8f8",
              bg: "#f8f8f8"
            }
          },
          createdAt: "2022-03-26 23:25:12",
          updatedAt: "2022-03-26 23:25:12"
        }
      ],
      {}
    ),

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
}
