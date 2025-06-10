// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from '@tailwindcss/vite';
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://loopyowlcomix.com",
  integrations: [mdx(), sitemap()],
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
	vite: {
		plugins: [tailwindcss()],
	},
});
