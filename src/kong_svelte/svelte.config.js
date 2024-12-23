import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: "dist",
      assets: "dist",
      fallback: "index.html",
      precompress: false,
      strict: true,
    }),
    files: {
      assets: "static",
    },
    alias: {
      $lib: 'src/lib',
      "$lib/*": 'src/lib/*',
    },
    prerender: {
      handleHttpError: ({ path, referrer, message }) => {
        // ignore deliberate link to shiny 404 page
        if (path === '/404') {
          return;
        }
        if (path.startsWith('/pxcomponents/')) {
          return;
        }
        // otherwise fail the build
        throw new Error(message);
      },
      handleMissingId: ({ id, path, referrers }) => {
        // Ignore missing hash links for specific routes
        if (id === 'swap' || id === 'pools' || id === 'stats' || id === 'earn') {
          return;
        }
        // Otherwise, fail the build
        throw new Error(
          `Missing ID "${id}" for link in ${referrers.join(', ')} pointing to ${path}`
        );
      }
    },
  },
  preprocess: vitePreprocess({
    typescript: true,
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  }),
  onwarn: (warning, handler) => {
    if (warning.code.startsWith('a11y_')) {
      return;
    }
    handler(warning);
  },
};

export default config;