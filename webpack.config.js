const path = require('path');

module.exports = {
  entry: './frontend/main.js',

  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
  },

  mode: 'development',

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  devServer: {
    contentBase: path.join(__dirname, './public'),
    port: 9000,
  },

  watch: true,

  devtool: 'source-map',
};
