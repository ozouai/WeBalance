// webpack.config.js
const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: path.join(__dirname, 'app-entry.jsx'),
    output: {
        path: path.join(__dirname, 'www', 'js'),
        filename: 'bundle.js'
    },
    target:"web",
    module: {
        loaders: [{
            test: path.join(__dirname),
            loader: 'babel-loader',
            query: {
                cacheDirectory: 'babel_cache',
                presets: ['react', 'es2015']
            }
        }]
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        }),
        //new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        /*new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false },
            mangle: true,
            sourcemap: false,
            beautify: false,
            dead_code: true
        })*/
    ]
};