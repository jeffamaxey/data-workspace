const path = require("path");
const webpack = require("webpack");
const BundleTracker = require('webpack-bundle-tracker')

module.exports = {
  context: __dirname,
  mode: 'development',
  // entry: "./src/index.js",
  entry: {
    main: [
      'react-hot-loader/patch',
      'webpack-dev-server/client?http://0.0.0.0:3000',
      'webpack/hot/only-dev-server',
      path.join(__dirname, './src/index')
    ]
  },
  output: {
    path: path.resolve('./bundles/'),
    filename: "[name]-[hash].js",
    publicPath: 'http://0.0.0.0:3000/js/builds/',
  },
  module: {
    rules: [
      {
        test: /\.js|.jsx$/,
        exclude: /node_modules/,
        use: "babel-loader",
        resolve: {
          extensions: ['.jsx', '.js']
        }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  optimization: {
    minimize: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("development"),
      },
    }),
    new BundleTracker({filename: './stats/webpack-stats.json'}),
    new webpack.HotModuleReplacementPlugin(),
  ],
  devServer: {
    inline: true,
    hot: true,
    historyApiFallback: true,
    host: '0.0.0.0',
    port: 3000,
    disableHostCheck: true,
    headers: { 'Access-Control-Allow-Origin': '*' }
  }
};
