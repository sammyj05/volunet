# Tefilá de Hannah

Página donde las invitadas dejan los pedidos que Hannah lleva en su Tefilá el día de la boda.
Corre en Cloudflare Workers: la página es estática (`public/`) y los pedidos se guardan en un
Durable Object con SQLite. No hay que crear bases de datos ni nada en el panel: el primer deploy
lo crea todo.

## Opción A: publicar desde el panel de Cloudflare (sin terminal)

1. Entra a https://dash.cloudflare.com y crea una cuenta gratis si no tienes.
2. Menú izquierdo: **Workers & Pages** → **Create** → pestaña **Workers** → **Import a repository**.
3. Conecta tu cuenta de GitHub y elige este repositorio.
4. En la configuración del proyecto:
   - **Root directory:** `tefila-hannah`
   - **Build command:** déjalo vacío
   - **Deploy command:** `npx wrangler deploy`
5. **Deploy**. Al terminar, Cloudflare muestra la URL, algo como
   `https://tefila-hannah.<tu-cuenta>.workers.dev`. Ese es el enlace para mandar.

Cada vez que se suba un cambio a la rama conectada, Cloudflare vuelve a publicar solo.

## Opción B: publicar desde la terminal

Necesitas Node 18+.

```bash
cd tefila-hannah
npm install
npx wrangler login     # abre el navegador para autorizar
npx wrangler deploy
```

Wrangler imprime la URL. Para volver a publicar después de un cambio: `npx wrangler deploy`.

## Cómo funciona

- `POST /api/pedidos` guarda un pedido (público, sin login).
- `GET /api/pedidos` devuelve todos los pedidos. Solo responde si el header `x-codigo`
  trae el código privado; el código no está escrito en el código fuente, solo su huella SHA-256.
- El 🩵 al final de la página abre la casilla del código. Con el código correcto aparece la
  lista, el botón de Excel y el de copiar para Google Sheets.

## Cambiar el código privado

```bash
printf 'NUEVOCODIGO' | sha256sum
```

Escribe el código en mayúsculas y sin espacios antes de calcular la huella. Reemplaza el valor
de `HUELLA_CODIGO` en `src/worker.js` con el resultado y vuelve a publicar.
