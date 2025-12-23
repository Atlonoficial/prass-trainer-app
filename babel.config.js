// babel.config.js
module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@': './src',
                    },
                },
            ],
            // Reanimated plugin temporarily disabled due to worklets dependency issue
            // 'react-native-reanimated/plugin',
        ],
    };
};
