import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'src', 'data']) await cp(file, `dist/${file}`, { recursive: true });
console.log('Built static application in dist/');
