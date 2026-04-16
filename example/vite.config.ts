import { defineConfig } from "vite";
import { zincPlugin } from "zinc/vite-plugin";

export default defineConfig({
  plugins: [
    zincPlugin({
      name: "Zinc Demo",
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
