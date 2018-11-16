const slsw = require("serverless-webpack");
const nodeExternals = require("webpack-node-externals");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: slsw.lib.entries,
  target: "node",
  // Since 'aws-sdk' is not compatible with webpack,
  // we exclude all node dependencies
  externals: [nodeExternals(), "aws-sdk"],
  devtool: "source-map",
  // Run babel on all .js files and skip those in node_modules
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        include: __dirname,
        exclude: /node_modules/
      }
    ]
  },
  // plugins: [
  // 	new CopyWebpackPlugin([
  // 		{
  // 			from: 'emailTemplates',
  // 			to: 'emailTemplates'
  // 		}
  // 	])
  // ],
  node: {
    __filename: true,
    __dirname: true
  }
};
