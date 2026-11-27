import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    {
      name: 'shutdown-handler',
      configureServer(server) {
        server.middlewares.use('/__shutdown', (req, res) => {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('SHUTTING_DOWN');
          setTimeout(() => {
            try { server.httpServer?.close(); } catch {}
            process.exit(0);
          }, 100);
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
  },
});


