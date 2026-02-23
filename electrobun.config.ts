export default {
  app: {
    name: "Zowe Jobs Viewer",
    identifier: "dev.zowe.jobs-viewer",
    version: "1.0.0",
  },
  build: {
    bun: {
      entrypoint: "src/bun/index.ts",
      external: ["@zowe/secrets-for-zowe-sdk"],
    },
    views: {
      app: {
        entrypoint: "src/app/index.tsx",
        jsx: {
          runtime: "automatic",
          importSource: "preact",
        },
      },
    },
    copy: {
      "src/app/index.html": "views/app/index.html",
      "src/app/styles.css": "views/app/styles.css",
    },
  },
};
