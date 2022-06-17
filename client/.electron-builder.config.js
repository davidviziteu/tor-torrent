/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: "torano client 1.0",
  productName: "Torano client",
  copyright: "Copyright © 2022 ${author}",
  asar: true,
  directories: {
    output: "release/${version}",
    buildResources: "build",
  },
  files: [
    "dist",
    "client_server.js",
    "models",
    "utils",
    "node_modules",
    ".toranofiles",
    ".data10000.json"
  ],
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"],
      },
    ],
    artifactName: "${productName}-${version}-Setup.${ext}",
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
  },
  mac: {
    target: ["dmg"],
    artifactName: "${productName}-${version}-Installer.${ext}",
  },
  linux: {
    target: ["AppImage"],
    artifactName: "${productName}-${version}-Installer.${ext}",
  },
  extraFiles: [
    "client_server.js",
    "models",
    "utils",
    "node_modules",
    ".toranofiles",
    ".data10000.json"
  ],
  extraResources: [
    {
      "from": "./packages/renderer/resources/file.svg",
      "to": "./file.svg"
    },
    {
      "from": "./packages/renderer/resources/x.svg",
      "to": "./x.svg"
    }
  ],
  asar: false
}
