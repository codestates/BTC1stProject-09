![image](https://user-images.githubusercontent.com/10539949/155831893-dcb6492b-3d61-4a40-b08a-442474088cb3.png)

# TEAM DRIVE
**Wallet and Tx Explorer on Internet Computer Network**

The project was bootstrapped using `npm init gatsby`, with the following modifications:

- Changing `src/pages/index.js` to be our new app
- adding `dfx.json` to deploy the application on the IC

Then, to add an IC backend,

- Adds `src/backend` with HashMap logic
- adds `gatsby-node` to configure webpack to handle environment variables for the dfx-generated actor

## Quickstart

Install the codebase with `npm install`

Follow directions to install `dfx` if you don't have it yet: https://sdk.dfinity.org/docs/index.html

run `dfx start --background` to start a replica;

run `dfx deploy basic_ic_wallet` to deploy the backend canister

run `npm start` to spin up a development server

Finally, hit `http://localhost:8080/`

![image](https://user-images.githubusercontent.com/10539949/155831743-1bf51905-348a-4f07-aaab-f3b16092ed3c.png)

## Publishing

Run `npm run build` to compile the frontend app

Run `dfx deploy --network=ic` to deploy the app on Sodium
