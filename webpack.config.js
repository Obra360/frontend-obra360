// webpack.config.js
const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'src', 'sidebar-app.js'),

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'sidebar-bundle.js',
  },
  
  devServer: {
    // CORREGIDO: Le decimos explícitamente al servidor que sirva los archivos
    // estáticos (como index.html) desde la carpeta raíz del proyecto.
    static: {
      directory: path.join(__dirname),
    },
    compress: true,
    port: 8080,
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', '@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
