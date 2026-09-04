# Tefilá de Hannah (versión Vercel)

Página donde las invitadas dejan los pedidos que Hannah lleva en su Tefilá el día de la boda.
La página es estática (`public/`), la función `api/pedidos.js` guarda y lista los pedidos, y los
datos viven en Upstash Redis (gratis, se conecta desde el panel de Vercel).

## Publicar (todo con clics, ~5 minutos)

1. Entra a https://vercel.com y crea una cuenta con tu GitHub si no tienes.
2. **Add New…** → **Project** → **Import** el repositorio `volunet`.
3. En la pantalla de configuración:
   - **Root Directory:** haz clic en **Edit** y elige `tefila-hannah-vercel`.
   - **Framework Preset:** Other. Deja build command y output vacíos.
   - **Deploy**.
4. Cuando termine, abre el proyecto → pestaña **Storage** → **Create Database** →
   **Upstash** → **Redis** → plan gratis → **Create** → **Connect Project** (elige este proyecto,
   todos los entornos). Esto crea solas las variables `UPSTASH_REDIS_REST_URL` y
   `UPSTASH_REDIS_REST_TOKEN`.
5. Pestaña **Deployments** → menú `⋯` del último deploy → **Redeploy**.

La URL queda en la pestaña **Project**, algo como `https://tefila-hannah-vercel.vercel.app`.
Ese es el enlace para mandar por WhatsApp. Cada push a la rama conectada vuelve a publicar solo.

Si el paso 4 se hace antes del 3, no hace falta el paso 5.

## Cómo funciona

- `POST /api/pedidos` guarda un pedido (público, sin login).
- `GET /api/pedidos` devuelve todos los pedidos. Solo responde si el header `x-codigo`
  trae el código privado; el código no está escrito en el código fuente, solo su huella SHA-256.
- La entrada privada está escondida: tres toques seguidos sobre la firma "Hannah" al final de su mensaje abren la casilla del código. El código se pide en cada recarga. Con el código correcto aparece la
  lista, el botón de Excel y el de copiar para Google Sheets.
- Mientras Upstash no esté conectado, la página avisa "Falta conectar la base de datos" al enviar.

## Cambiar el código privado

```bash
printf 'NUEVOCODIGO' | sha256sum
```

Escribe el código en mayúsculas y sin espacios antes de calcular la huella. Reemplaza el valor
de `HUELLA_CODIGO` en `api/pedidos.js` con el resultado y haz push.
