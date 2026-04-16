import { defineConfig } from "vite";
import { aPlugin } from "zinc/vite-plugin";

export default defineConfig({
  plugins: [
    aPlugin({
      name: "A Demo",
      window: {
        title: "A App Demo",
        width: 1200,
        height: 800,
        center: true,
      },
      verbose: true,
    }),
  ],
});
