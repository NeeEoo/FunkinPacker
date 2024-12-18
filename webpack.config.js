import path from 'path';
import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
//import argv from 'optimist'.argv;

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let entry = [
	'./src/client/index.tsx'
];

let plugins = [];
let debug = true;

let output = 'static/js/index.js';
let devtool = debug ? 'eval-source-map' : 'source-map';

let profiler = debug
let prod = !debug;

const argv = {
	build: prod
}

//if(true) {
	entry.unshift('core-js/stable');
//}

let PLATFORM = argv.platform || 'web';
let mode = prod ? 'production' : 'development';//argv.build ? 'production' : 'development';

let target = 'web';
if (PLATFORM === 'electron') target = 'electron-renderer';

plugins.push(new webpack.DefinePlugin({
	'process.env.NODE_ENV': JSON.stringify(mode),
	'PLATFORM': JSON.stringify(PLATFORM),
	'PROFILER': JSON.stringify(profiler),
	'DEBUG': JSON.stringify(debug)
}));

if (argv.build) {
	let outputDir;

	if (PLATFORM === 'web') {
		outputDir = 'web/';
	}

	if (PLATFORM === 'electron') {
		outputDir = '../electron/www/';
	}

	plugins.push(new CopyPlugin({
		patterns: [
			{from: 'src/client/resources', to: outputDir, globOptions: {ignore: ['**/.DS_Store']}}
		],
	}));

	//devtool = false;
	output = outputDir + 'static/js/index.js';
	debug = false;
}
else {
	entry.push('webpack-dev-server/client?http://localhost:4000');
	plugins.push(new CopyPlugin({
		patterns: [
			{from: 'src/client/resources', to: '', globOptions: {ignore: ['**/.DS_Store']}},
		],
	}));
}

/*plugins.push(
	new (import('webpack-bundle-analyzer').BundleAnalyzerPlugin)()
);*/

const config = {
	entry,
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: output
	},
	devServer: {
		static: './dist',
	},
	devtool,
	target,
	mode,
	module: {
		noParse: /.*[/\\]bin[/\\].+\.js/,
		rules: [
			{
				test: /\.tsx$/,
				use: [
					{loader: 'ts-loader'},
					//{loader: 'babel-loader', options: {presets: ['@babel/preset-react', '@babel/preset-env']}}
				],
				exclude: /node_modules/,
			},
			{
				test: /\.ts$/,
				use: [
					{loader: 'ts-loader'},
					//{loader: 'babel-loader', options: {presets: ['@babel/preset-env']}}
				],
				exclude: /node_modules/,
			},
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
			},
			{
				test: /\.mst$/,
				use: [{loader: 'raw-loader'}]
			}
		]
	},
	optimization: {
		minimize: prod,
		usedExports: true,
	},
	plugins
};

if (target === 'electron-renderer') {
	config.resolve = {
		alias: {'platform': path.resolve(__dirname, './src/client/platform/electron')}
	};
} else {
	config.resolve = {
		alias: {'platform': path.resolve(__dirname, './src/client/platform/web')}
	};
}
config.resolve.alias.api = path.resolve(__dirname, './src/api');
config.resolve.alias.client = path.resolve(__dirname, './src/client');
config.resolve.alias.TypedObserver = path.resolve(__dirname, './src/client/TypedObserver');
config.resolve.extensions = ['.tsx', '.ts', '.jsx', '.js'];

export default config;