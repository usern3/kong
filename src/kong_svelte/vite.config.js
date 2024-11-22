import { fileURLToPath, URL } from 'url';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

dotenv.config({ 
  path: path.resolve(__dirname, "../../.env"),
  override: true 
});

const ENV = process.env.DFX_NETWORK || 'local';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  const icHost = "https://icp-api.io";

  return {
    build: {
      emptyOutDir: true,
      sourcemap: true
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: "globalThis",
        },
      },
    },
    server: {
      proxy: {
        "/api/v2/canister": {
          target: "https://icp-api.io",
          changeOrigin: true
        },
        "/api/v2/status": {
          target: "https://icp-api.io",
          changeOrigin: true
        }
      }
    },
    plugins: [
      sveltekit(),
      environment("all", { prefix: "CANISTER_" }),
      environment("all", { prefix: "DFX_" }),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'KongSwap',
          short_name: 'KongSwap',
          description: 'KongSwap is a decentralized exchange for the Internet Computer',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico,webp,woff,woff2,ttf,json}'],
        },
      }),
    ],
    resolve: {
      alias: [
        {
          find: "@declarations",
          replacement: fileURLToPath(
            new URL("../declarations", import.meta.url)
          ),
        },
        {
          find: "$lib",
          replacement: fileURLToPath(
            new URL("../src/lib", import.meta.url)
          ),
        },
      ],
    },
    test: {
      globals: true,
      environment: 'jsdom',
    },
    define: {
      'process.env.CANISTER_ID_KONG_BACKEND': JSON.stringify(env.CANISTER_ID_KONG_BACKEND),
      'process.env.CANISTER_ID_ICP_LEDGER': JSON.stringify(env.CANISTER_ID_ICP_LEDGER),
      'process.env.DFX_NETWORK': JSON.stringify(env.DFX_NETWORK),
      'process.env.IC_HOST': JSON.stringify(env.IC_HOST),
    }
  };
});
