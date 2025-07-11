# MyDev Chrome Extension

- Based on MyDoge Wallet
- Copyright MyDoge Inc. 2023. All rights reserved.
- Modified for Dogecoinev Network
- **Shoutout to [@mydoge](https://github.com/mydoge-com)** for the original MyDoge Wallet, which we forked to create MyDev!

## 🚀 Quick start

- Use Node.js version 20
- Use Yarn installed by NPM only: `npm install --global yarn`
- Install packages with `yarn install`.
- Create a file named .env at the root of the project and populate entries from .env.example
- Run `yarn start` to start the development server
- Open [http://localhost:3000](http://localhost:3000) to view the development build in your browser

## Building the extension

- Run `yarn build` to build the app for production to the `build` folder.<br />
  It correctly bundles React in production mode and optimizes the build for the best performance.

- Install [Extensions Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid?hl=en) Chrome extension to enable automatic extension reload after every build.

- Run `yarn watch` to build and reload the extension with every file change.
