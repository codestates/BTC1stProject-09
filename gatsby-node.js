const dfxJson = require("./dfx.json");
const webpack = require("webpack");
const path = require("path");

let localCanisters, prodCanisters, canisters;

function initCanisterIds() {
  try {
    localCanisters = require(path.resolve(
      ".dfx",
      "local",
      "canister_ids.json"
    ));
  } catch (error) {
    console.log("No local canister_ids.json found. Continuing production");
  }
  try {
    prodCanisters = require(path.resolve("canister_ids.json"));
  } catch (error) {
    console.log("No production canister_ids.json found. Continuing with local");
  }

  const network =
    process.env.DFX_NETWORK ||
    (process.env.NODE_ENV === "production" ? "ic" : "local");

  canisters = network === "local" ? localCanisters : prodCanisters;

  for (const canister in canisters) {
    process.env[canister.toUpperCase() + "_CANISTER_ID"] =
      canisters[canister][network];
  }
}
initCanisterIds();

exports.onCreateWebpackConfig = ({ stage, actions }) => {
  actions.setWebpackConfig({
    resolve: {
      modules: [path.resolve(__dirname, "src"), "node_modules"],
      fallback: {
        stream: require.resolve("stream-browserify"),
        crypto: require.resolve("crypto-browserify"),
      },
    },
    plugins: [
      new webpack.EnvironmentPlugin({
        NODE_ENV: "development",
        BASIC_IC_WALLET_CANISTER_ID: canisters["basic_ic_wallet"],
      }),
      new webpack.ProvidePlugin({
        Buffer: [require.resolve("buffer/"), "Buffer"],
      }),
    ],
  });
};
