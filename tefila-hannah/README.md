# Tefilá de Hannah

Página donde las invitadas dejan los pedidos que Hannah lleva en su Tefilá el día de la boda.
Corre en Cloudflare Workers: la página es estática (`public/`) y los pedidos se guardan en Workers KV.

## Desplegar (una sola vez, ~5 minutos)

Necesitas Node 18+ y una cuenta de Cloudflare (el plan gratis alcanza).

```bash
cd tefila-hannah
npm install
npx wrangler login                          # abre el navegador para autorizar
npx wrangler kv namespace create PEDIDOS    # devuelve un id
```

Pega ese `id` en `wrangler.toml` donde dice `REEMPLAZA_CON_EL_ID_DEL_KV`, y luego:

```bash
npx wrangler deploy
```

Wrangler imprime la URL, algo como `https://tefila-hannah.<tu-cuenta>.workers.dev`.
Ese es el enlace que se manda por WhatsApp.

Para volver a publicar después de un cambio: `npx wrangler deploy`.

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

Reemplaza el valor de `HUELLA_CODIGO` en `src/worker.js` con esa huella (en mayúsculas y sin espacios
el código, antes de calcularla) y vuelve a desplegar.
