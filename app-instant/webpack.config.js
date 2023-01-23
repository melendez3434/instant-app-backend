const createExpoWebpackConfigAsync = require('@expo/webpack-config')

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv)
  // Customize the config before returning it.
  return {
    ...config,
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        // {
        //   test: /\.ttf$/,
        //   loader: 'url-loader', // or directly file-loader
        //   include: path.resolve(
        //     __dirname,
        //     'node_modules/react-native-vector-icons',
        //   ),
        // },
      ],
    },
  }
}
