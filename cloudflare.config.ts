import { bindings, defineConfig, defineWorker } from "cf/config";
import { loadEnv } from "vite";

export default defineConfig(({mode}) => {
  const variables=loadEnv(mode || 'production',process.cwd(),'');
  return {
  accountId: "12a5b5b1a1b413d24ab474c21db9e55b",
  worker: defineWorker({
    name: "community",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-15",
    compatibilityFlags: ["nodejs_compat"],
    workersDev: false,
    previewUrls: false,
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      APP_ORIGIN: bindings.text(variables.APP_ORIGIN || 'http://127.0.0.1:4173'),
      ALLOW_PUBLIC_SIGNUP: bindings.text(variables.ALLOW_PUBLIC_SIGNUP || 'false'),
    },
  }),
  };
});
