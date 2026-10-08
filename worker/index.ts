export interface Env {
  DB: D1Database;
  ASSETS?: Fetcher;
}

interface ShareRecord {
  id: string;
  code: string;
  content: string;
  content_type: 'text' | 'url';
  created_at: number;
  expires_at: number;
}

const DEFAULT_EXPIRATION_SECONDS = 600; // 10 minutes
const RETRIEVE_RATE_LIMIT = 20; // 20 attempts per minute
const CREATE_RATE_LIMIT = 15; // 15 creations per minute
const MAX_COLLISION_RETRIES = 5;

// Uniform cryptographically secure 4-digit code generator (0000 - 9999)
function generateSecureCode(): string {
  const array = new Uint16Array(1);
  let val: number;
  do {
    crypto.getRandomValues(array);
    val = array[0];
  } while (val >= 60000); // 60000 is a multiple of 10000, eliminating modulo bias
  const num = val % 10000;
  return num.toString().padStart(4, '0');
}

// Check if string is a safe HTTP/HTTPS URL
export function isSafeUrl(str: string): boolean {
  try {
    const parsed = new URL(str.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Standard security headers
function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// JSON error response helper
function errorResponse(code: string, message: string, status: number): Response {
  const res = new Response(
    JSON.stringify({
      error: {
        code,
        message,
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return addSecurityHeaders(res);
}

// JSON success response helper
function jsonResponse(data: unknown, status = 200): Response {
  const res = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return addSecurityHeaders(res);
}

// IP-based Rate Limiter using D1
async function checkRateLimit(
  db: D1Database,
  ip: string,
  action: 'retrieve' | 'create',
  limit: number
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const key = `rl:${action}:${ip}`;

  try {
    const existing = await db
      .prepare('SELECT count, reset_at FROM rate_limits WHERE key = ?')
      .bind(key)
      .first<{ count: number; reset_at: number }>();

    if (existing && existing.reset_at > now) {
      if (existing.count >= limit) {
        return false; // Rate limited
      }
      await db
        .prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
        .bind(key)
        .run();
    } else {
      // Create new window
      const resetAt = now + 60;
      await db
        .prepare(
          'INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = ?'
        )
        .bind(key, resetAt, resetAt)
        .run();
    }
    return true;
  } catch (err) {
    // If rate limit table check fails, fail open to avoid service outage, but log
    console.error('Rate limit check error:', err);
    return true;
  }
}

// Opportunistic cleanup of expired shares and old rate limits
async function cleanupExpired(db: D1Database): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  try {
    await db.prepare('DELETE FROM shares WHERE expires_at <= ?').bind(now).run();
    await db.prepare('DELETE FROM rate_limits WHERE reset_at <= ?').bind(now).run();
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1'
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API Routes
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(url.pathname, request, env, ctx);
    }

    // Serve static frontend assets if ASSETS binding is available
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleApiRequest(
  pathname: string,
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // CORS Preflight if needed
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Health check
  if (pathname === '/api/health' && request.method === 'GET') {
    return jsonResponse({ status: 'ok' });
  }

  // Ensure DB binding is present
  if (!env.DB) {
    return errorResponse(
      'SERVER_ERROR',
      'Database binding is not configured.',
      500
    );
  }

  const clientIp = getClientIp(request);

  // 1. Create Share: POST /api/share
  if (pathname === '/api/share' && request.method === 'POST') {
    // Rate limit check
    const allowed = await checkRateLimit(env.DB, clientIp, 'create', CREATE_RATE_LIMIT);
    if (!allowed) {
      return errorResponse(
        'RATE_LIMITED',
        'Too many attempts. Please wait a moment and try again.',
        429
      );
    }

    let body: { content?: unknown; contentType?: unknown };
    try {
      body = (await request.json()) as { content?: unknown; contentType?: unknown };
    } catch {
      return errorResponse('INVALID_CONTENT', 'Invalid JSON body.', 400);
    }

    const rawContent = typeof body.content === 'string' ? body.content.trim() : '';
    if (!rawContent) {
      return errorResponse('INVALID_CONTENT', 'Content cannot be empty.', 400);
    }

    // Determine content type safely
    let detectedType: 'text' | 'url' = 'text';
    if (body.contentType === 'url' || isSafeUrl(rawContent)) {
      if (!isSafeUrl(rawContent)) {
        return errorResponse(
          'INVALID_CONTENT',
          'Invalid URL. Only HTTP and HTTPS URLs are supported.',
          400
        );
      }
      detectedType = 'url';
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + DEFAULT_EXPIRATION_SECONDS;

    // Trigger non-blocking cleanup of expired records
    ctx.waitUntil(cleanupExpired(env.DB));

    // Collision check & secure code generation
    let generatedCode: string | null = null;
    for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
      const candidateCode = generateSecureCode();
      const existing = await env.DB
        .prepare('SELECT id FROM shares WHERE code = ? AND expires_at > ?')
        .bind(candidateCode, now)
        .first();

      if (!existing) {
        generatedCode = candidateCode;
        break;
      }
    }

    if (!generatedCode) {
      return errorResponse(
        'SERVER_ERROR',
        'Unable to allocate a unique code right now. Please try again.',
        500
      );
    }

    const shareId = crypto.randomUUID();

    try {
      await env.DB
        .prepare(
          'INSERT INTO shares (id, code, content, content_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
        )
        .bind(shareId, generatedCode, rawContent, detectedType, now, expiresAt)
        .run();

      return jsonResponse({
        code: generatedCode,
        expiresAt,
      });
    } catch (err) {
      console.error('Insert share error:', err);
      return errorResponse(
        'SERVER_ERROR',
        'Something went wrong. Please try again.',
        500
      );
    }
  }

  // 2. Retrieve Share: POST /api/retrieve
  if (pathname === '/api/retrieve' && request.method === 'POST') {
    // Rate limit check
    const allowed = await checkRateLimit(env.DB, clientIp, 'retrieve', RETRIEVE_RATE_LIMIT);
    if (!allowed) {
      return errorResponse(
        'RATE_LIMITED',
        'Too many attempts. Please wait a moment and try again.',
        429
      );
    }

    let body: { code?: unknown };
    try {
      body = (await request.json()) as { code?: unknown };
    } catch {
      return errorResponse('INVALID_CODE', 'Invalid JSON body.', 400);
    }

    const rawCode = typeof body.code === 'string' ? body.code.trim() : '';
    if (!/^\d{4}$/.test(rawCode)) {
      return errorResponse('INVALID_CODE', 'Enter a 4-digit code.', 400);
    }

    const now = Math.floor(Date.now() / 1000);

    // Opportunistic cleanup in background
    ctx.waitUntil(cleanupExpired(env.DB));

    try {
      const share = await env.DB
        .prepare(
          'SELECT id, code, content, content_type, expires_at FROM shares WHERE code = ?'
        )
        .bind(rawCode)
        .first<ShareRecord>();

      if (!share) {
        return errorResponse(
          'SHARE_NOT_FOUND',
          'This code is invalid or expired.',
          404
        );
      }

      // Check if expired
      if (share.expires_at <= now) {
        // Opportunistically delete expired record
        await env.DB.prepare('DELETE FROM shares WHERE id = ?').bind(share.id).run();
        return errorResponse(
          'SHARE_NOT_FOUND',
          'This code is invalid or expired.',
          404
        );
      }

      return jsonResponse({
        content: share.content,
        contentType: share.content_type,
        expiresAt: share.expires_at,
      });
    } catch (err) {
      console.error('Retrieve share error:', err);
      return errorResponse(
        'SERVER_ERROR',
        'Something went wrong. Please try again.',
        500
      );
    }
  }

  return errorResponse('NOT_FOUND', 'Route not found.', 404);
}
