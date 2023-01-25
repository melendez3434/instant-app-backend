const createExpoWebpackConfigAsync = require('@expo/webpack-config')
const path = require('path')

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv)
  // Customize the config before returning it.

  return {
    ...config,
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.ttf$/,
          loader: 'file-loader', // or directly file-loader
          include: path.resolve(
            __dirname,
            'node_modules/react-native-vector-icons',
          ),
        },
      ],
    },
  }
}
