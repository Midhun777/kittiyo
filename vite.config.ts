import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(async () => {
  const isVercel = Boolean(process.env.VERCEL);
  const plugins = [tailwindcss(), react()];

  if (!isVercel) {
    try {
      const { cloudflare } = await import('@cloudflare/vite-plugin');
      plugins.push(cloudflare());
    } catch (e) {
      console.warn('Cloudflare plugin not loaded:', e);
    }
  }

  return {
    plugins,
    build: {
      outDir: isVercel ? 'dist' : undefined,
    },
  };
});
