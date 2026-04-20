import { defineConfig } from "vite";
import { vokexPlugin } from "vokex/vite-plugin";
import { version } from "./package.json";

export default defineConfig({
  plugins: [
    vokexPlugin({
      name: "Vokex Demo",
      identifier: "com.vokex.vokex-demo",
      version: version,
      window: {
        title: "Vokex App Demo",
        width: 1200,
        height: 800,
        center: true,
      },
      verbose: true,
    }),
  ],
});
