// Tefilá de Hannah — función serverless de Vercel
// POST /api/pedidos guarda un pedido. GET /api/pedidos lista todos (solo con el código privado).
// Los pedidos viven en Upstash Redis (se conecta desde el panel de Vercel, Storage → Upstash).

import { Redis } from '@upstash/redis';
import { createHash } from 'node:crypto';

const HUELLA_CODIGO = 'df343fa52683f80c3c14f319d94089f74ce3bc270c3b79782cb6bc85f31cb219';
const CAMPOS = ['otro', 'refua', 'zivug', 'pribeten', 'leda', 'parnasa', 'shalom'];
const MAX_LARGO = 4000;
const LISTA = 'tefila-hannah:pedidos';

export function conectar(env = process.env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function texto(v, max = MAX_LARGO) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function huella(t) {
  return createHash('sha256').update(t).digest('hex');
}

export function armarRegistro(cuerpo, ahora = new Date()) {
  if (!cuerpo || typeof cuerpo !== 'object') return { error: 'Cuerpo inválido' };
  const registro = {};
  CAMPOS.forEach((c) => { registro[c] = texto(cuerpo[c]); });
  if (!CAMPOS.some((c) => registro[c])) return { error: 'Escribe al menos un pedido.' };

  const hebreo = texto(cuerpo.hebreo, 200);
  registro.hebreo = hebreo || 'Anónimo';
  registro.anonimo = !hebreo;
  registro.id = ahora.getTime() + '-' + Math.random().toString(36).slice(2, 10);
  registro.creadaEn = ahora.toISOString();
  registro.fechaTexto = ahora.toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Caracas' });
  return { registro };
}

export function codigoValido(valor) {
  const codigo = String(valor || '').trim().toUpperCase().replace(/\s+/g, '');
  return Boolean(codigo) && huella(codigo) === HUELLA_CODIGO;
}

export default async function handler(req, res) {
  const redis = conectar();
  if (!redis) {
    return res.status(500).json({ error: 'Falta conectar la base de datos (Upstash Redis) en el panel de Vercel.' });
  }

  if (req.method === 'POST') {
    let cuerpo = req.body;
    if (typeof cuerpo === 'string') {
      try { cuerpo = JSON.parse(cuerpo); } catch (e) { return res.status(400).json({ error: 'JSON inválido' }); }
    }
    const { registro, error } = armarRegistro(cuerpo);
    if (error) return res.status(400).json({ error });
    await redis.lpush(LISTA, JSON.stringify(registro));
    return res.status(201).json({ ok: true, id: registro.id });
  }

  if (req.method === 'GET') {
    if (!codigoValido(req.headers['x-codigo'])) return res.status(401).json({ error: 'Código incorrecto' });
    const crudos = await redis.lrange(LISTA, 0, -1);
    const registros = crudos
      .map((r) => (typeof r === 'string' ? JSON.parse(r) : r))
      .sort((a, b) => (b.creadaEn || '').localeCompare(a.creadaEn || ''));
    return res.status(200).json(registros);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Método no permitido' });
}
