const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, './src/client.ts'),
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, './client/'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
};
