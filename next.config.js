const MiniCssExtractPlugin = require("mini-css-extract-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: {
		plugins: [new MiniCssExtractPlugin()],
	},
};

module.exports = nextConfig;
