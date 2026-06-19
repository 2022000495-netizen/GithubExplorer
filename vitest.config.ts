import { defineConfig, mergeConfig } from "vite";
import viteConfig from "./vite.config";
import { configDefaults } from "vitest/config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: "./vitest-setup",
      globals: true,
      exclude: [...configDefaults.exclude],
      coverage: {
        provider: "istanbul",
        enabled: true,

        include: [
          "src/**/*.{ts,tsx}",
          "!**/styles.{ts,tsx}",
          "!**/*.d.ts",
          "!src/index.tsx",
        ],
      },
    },
  })
);
