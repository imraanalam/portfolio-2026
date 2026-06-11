import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: Number(process.env.PORT) || 5175,
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        work: resolve(__dirname, 'work/index.html'),
        shipeezi: resolve(__dirname, 'work/shipeezi.html'),
        ikea: resolve(__dirname, 'work/ikea.html'),
        petsworld: resolve(__dirname, 'work/petsworld.html'),
        liverpool: resolve(__dirname, 'work/liverpool.html'),
        kaiser: resolve(__dirname, 'work/kaiser.html'),
      },
    },
  },
});
