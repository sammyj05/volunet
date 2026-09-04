// Tefilá de Hannah — Cloudflare Worker
// Sirve la página estática (public/) y guarda los pedidos en KV.

const HUELLA_CODIGO = 'df343fa52683f80c3c14f319d94089f74ce3bc270c3b79782cb6bc85f31cb219';
const CAMPOS = ['otro', 'refua', 'zivug', 'pribeten', 'leda', 'parnasa', 'shalom'];
const MAX_LARGO = 4000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/pedidos') {
      if (request.method === 'POST') return crear(request, env);
      if (request.method === 'GET') return listar(request, env);
      return json({ error: 'Método no permitido' }, 405);
    }
    return env.ASSETS.fetch(request);
  },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function texto(v, max = MAX_LARGO) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

async function huella(t) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function crear(request, env) {
  let cuerpo;
  try { cuerpo = await request.json(); } catch (e) { return json({ error: 'JSON inválido' }, 400); }
  if (!cuerpo || typeof cuerpo !== 'object') return json({ error: 'Cuerpo inválido' }, 400);

  const registro = {};
  CAMPOS.forEach((c) => { registro[c] = texto(cuerpo[c]); });
  if (!CAMPOS.some((c) => registro[c])) return json({ error: 'Escribe al menos un pedido.' }, 400);

  const hebreo = texto(cuerpo.hebreo, 200);
  registro.hebreo = hebreo || 'Anónimo';
  registro.anonimo = !hebreo;

  const ahora = new Date();
  registro.id = ahora.getTime() + '-' + crypto.randomUUID().slice(0, 8);
  registro.creadaEn = ahora.toISOString();
  registro.fechaTexto = ahora.toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Caracas' });

  await env.PEDIDOS.put('pedido:' + registro.id, JSON.stringify(registro));
  return json({ ok: true, id: registro.id }, 201);
}

async function listar(request, env) {
  const codigo = (request.headers.get('x-codigo') || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!codigo || (await huella(codigo)) !== HUELLA_CODIGO) return json({ error: 'Código incorrecto' }, 401);

  const claves = [];
  let cursor;
  do {
    const pagina = await env.PEDIDOS.list({ prefix: 'pedido:', cursor });
    pagina.keys.forEach((k) => claves.push(k.name));
    cursor = pagina.list_complete ? undefined : pagina.cursor;
  } while (cursor);

  const registros = [];
  for (let i = 0; i < claves.length; i += 50) {
    const lote = await Promise.all(claves.slice(i, i + 50).map((k) => env.PEDIDOS.get(k, 'json')));
    lote.forEach((r) => { if (r) registros.push(r); });
  }
  registros.sort((a, b) => (b.creadaEn || '').localeCompare(a.creadaEn || ''));
  return json(registros);
}
