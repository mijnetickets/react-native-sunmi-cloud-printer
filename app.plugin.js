const { withAppBuildGradle } = require('@expo/config-plugins');

function replace(contents, match, replace) {
  if (!contents.includes(match)) {
    return contents;
  }
  return contents.replace(match, replace);
}

const withLocalAAR = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = replace(
        config.modResults.contents,
        `implementation("com.facebook.react:react-android")`,
        `implementation("com.facebook.react:react-android")\n    implementation files('../../node_modules/react-native-sunmi-cloud-printer/android/libs/externalprinterlibrary2-1.0.13-release.aar')`
      );
    } else {
      throw new Error("Can't enable APK optimizations because it's not groovy");
    }
    return config;
  });
};

module.exports = (config, props) => withLocalAAR(config, []);
