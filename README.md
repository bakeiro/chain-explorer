# ChainExplorer - Blockchain Transaction Explorer

Explorador de transacciones blockchain construido con Next.js.

## Despliegue en GitHub Pages

### Configuración

1. **Habilita GitHub Pages en tu repositorio:**
   - Ve a Settings > Pages
   - En "Build and deployment", selecciona "GitHub Actions"

2. **Configura el basePath (si tu repo NO se llama igual que tu usuario):**
   - Si tu repositorio se llama `mi-repo` y tu usuario es `usuario`
   - La URL será: `https://usuario.github.io/mi-repo/`
   - Edita `next.config.mjs` y descomenta estas líneas:
   ```js
   basePath: '/mi-repo',
   assetPrefix: '/mi-repo',
   ```
   - Cambia `mi-repo` por el nombre real de tu repositorio

3. **Push tu código:**
   ```bash
   git add .
   git commit -m "Configure for GitHub Pages"
   git push origin main
   ```

4. **El workflow se ejecutará automáticamente** y desplegará tu sitio

### Variables de entorno

Para configurar tu RPC provider, añade en la raíz del proyecto un archivo `.env.local`:

```
NEXT_PUBLIC_RPC_URL=http://localhost:8545
```

**Nota:** En GitHub Pages, las variables de entorno deben ser públicas (prefijo `NEXT_PUBLIC_`) y se incluirán en el build estático.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
