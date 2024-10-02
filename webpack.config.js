const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
//const argv = require('optimist').argv;

let entry = [
    'babel-polyfill',
    './src/client/index'
];

let plugins = [];

let devtool = 'eval-source-map';
let output = 'static/js/index.js';
let debug = true;

var prod = true;

var argv = {
    build: true
}

let PLATFORM = argv.platform || 'web';
let mode = prod ? 'production' : 'development';//argv.build ? 'production' : 'development';

let target = 'web';
if (PLATFORM === 'electron') target = 'electron-renderer';

plugins.push(new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(mode),
    'PLATFORM': JSON.stringify(PLATFORM)
}));

if (argv.build) {
    let outputDir;

    if (PLATFORM === 'web') {
        outputDir = 'web/';
    }

    if (PLATFORM === 'electron') {
        outputDir = '../electron/www/';
    }

    plugins.push(new CopyWebpackPlugin([{from: 'src/client/resources', to: outputDir}]));

    devtool = false;
    output = outputDir + 'static/js/index.js';
    debug = false;
}
else {
    entry.push('webpack-dev-server/client?http://localhost:4000');
    plugins.push(new CopyWebpackPlugin([{from: 'src/client/resources', to: './'}]));
}

let config = {
    entry: entry,
    output: {
        path: __dirname + "/dist",
        filename: output
    },
    devServer: {
        static: './dist',
    },
    devtool: devtool,
    target: target,
    mode: mode,
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    module: {
        noParse: /.*[\/\\]bin[\/\\].+\.js/,
        rules: [
            {
                test: /.jsx?$/,
                include: [path.resolve(__dirname, 'src')],
                use: [{loader: 'babel-loader', options: {presets: ['@babel/preset-react', '@babel/preset-env']}}]
            },
            {
                test: /\.js$/,
                include: [path.resolve(__dirname, 'src')],
                use: [{loader: 'babel-loader', options: {presets: ['@babel/preset-env']}}]
            },
            {
                test: /\.(html|htm)$/,
                use: [{loader: 'dom'}]
            }
        ]
    },
    optimization: {
        minimize: prod,
        usedExports: true,
    },
    plugins: plugins
};

if (target === 'electron-renderer') {
    config.resolve = {alias: {'platform': path.resolve(__dirname, './src/client/platform/electron')}};
} else {
    config.resolve = {alias: {'platform': path.resolve(__dirname, './src/client/platform/web')}};
}

module.exports = config;