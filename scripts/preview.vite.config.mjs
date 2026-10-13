import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({plugins:[react()],base:'/preview-assets/',define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{outDir:'.local-preview/client',emptyOutDir:true,lib:{entry:path.resolve('.local-preview/client.tsx'),formats:['es'],fileName:'client'}}});
