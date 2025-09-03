import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000,
        host: true
    },
    resolve: {
        alias: {
            "quickjs-emscripten": "https://esm.sh/quickjs-emscripten@0.31.0"
        },
    },
    optimizeDeps: {
        include: ['effect']
    }
}); 