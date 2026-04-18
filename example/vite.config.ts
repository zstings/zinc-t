import { defineConfig } from "vite";
import { zincPlugin } from "zinc/vite-plugin";
import { version } from "./package.json";

export default defineConfig({
  plugins: [
    zincPlugin({
      name: "Zinc Demo",
      identifier: "com.zinc.zinc-demo",
      version: version,
      window: {
        title: "Zinc App Demo",
        width: 1200,
        height: 800,
        center: true,
      },
      verbose: true,
    }),
  ],
});
