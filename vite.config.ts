import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "Planet-i-Green, plant health companion",
        short_name: "Planet-i-Green",
        description: "Point a camera at a plant and get a diagnosis and a low-cost fix.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["lifestyle", "education", "utilities"],
        // Chrome requires 192 and 512 px PNGs to offer installation; the maskable one lets
        // Android crop the icon to any shape. Regenerate with `node scripts/generate-icons.mjs`.
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
        ],
        shortcuts: [
          { name: "Scan a plant", short_name: "Scan", url: "/" },
          { name: "Care calendar", short_name: "Care", url: "/calendar" },
          { name: "Plant guide", short_name: "Explore", url: "/explore" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        // Client-side routes (/plants/123, /report/abc) should load the app shell offline.
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            // Map tiles: cache what you've looked at so the community map still draws offline.
            urlPattern: ({ url }) => url.hostname === "tile.openstreetmap.org",
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Plant photos from Supabase Storage: show the garden and reports offline.
            urlPattern: ({ url }) => url.pathname.includes("/storage/v1/object/public/plant-photos/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "plant-photos",
              expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
