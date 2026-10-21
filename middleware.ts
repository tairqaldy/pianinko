/**
 * Access gate. Every request needs the pass cookie, which is an HMAC of the access code.
 * The code itself lives only in the ACCESS_CODE environment variable, never in this repo.
 */
import { next } from '@vercel/functions';

declare const process: { env: Record<string, string | undefined> };

export const config = {
  matcher: '/((?!favicon\\.svg$).*)',
};

const COOKIE = 'pianinko_pass';
const YEAR = 60 * 60 * 24 * 365;

async function passFor(code: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(code.trim().toLowerCase()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('pianinko-pass-v1'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request: Request, name: string) {
  for (const part of (request.headers.get('cookie') ?? '').split(/;\s*/)) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return null;
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const code = process.env.ACCESS_CODE;
  if (!code) {
    return new Response('Pianinko is locked until ACCESS_CODE is set in the project environment.', { status: 503 });
  }
  const pass = await passFor(code);

  if (url.pathname === '/__unlock' && request.method === 'POST') {
    const form = await request.formData().catch(() => null);
    const given = String(form?.get('code') ?? '');
    if (given && sameText(await passFor(given), pass)) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/',
          'Set-Cookie': `${COOKIE}=${pass}; Path=/; Max-Age=${YEAR}; HttpOnly; Secure; SameSite=Lax`,
          'Cache-Control': 'no-store',
        },
      });
    }
    return gate(true);
  }

  if (url.pathname === '/__lock') {
    return new Response(null, {
      status: 303,
      headers: { Location: '/', 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`, 'Cache-Control': 'no-store' },
    });
  }

  const cookie = readCookie(request, COOKIE);
  if (cookie && sameText(cookie, pass)) return next();

  if (url.pathname.startsWith('/api/')) {
    return Response.json({ error: 'Locked. Open the piano with the access code first.' }, { status: 401 });
  }
  const wantsPage = request.method === 'GET' && (url.pathname === '/' || (request.headers.get('accept') ?? '').includes('text/html'));
  return wantsPage ? gate(false) : new Response('Locked', { status: 401, headers: { 'Cache-Control': 'no-store' } });
}

function gate(failed: boolean) {
  return new Response(GATE_HTML.replace('%FAILED%', failed ? 'failed' : ''), {
    status: failed ? 401 : 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}

const GATE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<meta name="theme-color" content="#F4F4F1" />
<title>Pianinko</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fira+Sans+Extra+Condensed:wght@900&family=Onest:wght@400;600&display=swap" />
<style>
  :root { --ink:#121212; --ink2:#4A4A47; --ink3:#6B6B66; --line:#E4E4DF; --canvas:#F4F4F1; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body { background: var(--canvas); color: var(--ink); font-family: Onest, system-ui, sans-serif; display: grid; place-items: center; overflow: hidden; -webkit-font-smoothing: antialiased; }
  .b { position: fixed; border-radius: 999px; pointer-events: none; animation: drift 9s ease-in-out infinite alternate; }
  @keyframes drift { to { transform: translateY(-26px); } }
  .card { position: relative; width: min(480px, calc(100vw - 32px)); display: flex; flex-direction: column; align-items: center; gap: 28px; padding: 44px 40px 36px; border-radius: 36px; background: #fff; border: 1px solid var(--line); box-shadow: 0 30px 80px rgba(18,18,18,.07); }
  h1 { margin: 0; font-family: 'Fira Sans Extra Condensed', 'Arial Narrow', sans-serif; font-weight: 900; font-size: clamp(56px, 16vw, 80px); line-height: .9; letter-spacing: -.02em; text-transform: uppercase; }
  p { margin: 10px 0 0; font-size: 15px; line-height: 22px; color: var(--ink2); text-align: center; }
  form { width: 100%; display: flex; flex-direction: column; gap: 12px; }
  .field { position: relative; height: 60px; border-radius: 999px; border: 2px solid var(--ink); display: flex; align-items: center; gap: 8px; padding: 0 20px; }
  .field input { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 999px; background: transparent; color: transparent; caret-color: transparent; font-size: 16px; padding: 0 20px; outline: none; }
  .field:focus-within { box-shadow: 0 0 0 4px #FFEDA8; }
  .dot { width: 14px; height: 14px; border-radius: 999px; flex-shrink: 0; animation: pop .22s cubic-bezier(.2,0,0,1); }
  @keyframes pop { from { transform: scale(.2); } }
  .caret { width: 2px; height: 24px; border-radius: 2px; background: var(--ink); animation: blink 1s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  .placeholder { color: #8E8E89; font-size: 15px; }
  button { height: 56px; border: 0; border-radius: 999px; background: var(--ink); color: #fff; font: 600 16px Onest, system-ui, sans-serif; cursor: pointer; transition: transform .12s; }
  button:active { transform: scale(.98); }
  button:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
  .hint { font-size: 13px; color: var(--ink3); text-align: center; margin: 4px 0 0; }
  .error { color: #9d3a1f; }
  .failed .field { animation: shake .32s; }
  @keyframes shake { 25% { transform: translateX(-6px); } 50% { transform: translateX(6px); } 75% { transform: translateX(-3px); } }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
</head>
<body class="%FAILED%">
  <div class="b" style="left:12%;top:62%;width:120px;height:120px;background:#FFD1E4;opacity:.7"></div>
  <div class="b" style="left:20%;top:46%;width:54px;height:54px;background:#FFEDA8;animation-delay:-3s"></div>
  <div class="b" style="left:16%;top:33%;width:22px;height:22px;background:#BFE0FF;animation-delay:-5s"></div>
  <div class="b" style="left:78%;top:20%;width:150px;height:150px;background:#BFE0FF;opacity:.7;animation-delay:-2s"></div>
  <div class="b" style="left:75%;top:42%;width:44px;height:44px;background:#C6F2D0;animation-delay:-6s"></div>
  <div class="b" style="left:83%;top:52%;width:18px;height:18px;background:#FFD9B8"></div>
  <div class="b" style="left:70%;top:77%;width:70px;height:70px;background:#BDF1F4;opacity:.8;animation-delay:-4s"></div>
  <main class="card">
    <div style="display:flex;flex-direction:column;align-items:center">
      <h1>Pianinko</h1>
      <p>A private little piano. Type the access code to come in.</p>
    </div>
    <form method="post" action="/__unlock" autocomplete="off">
      <label class="field">
        <span id="dots" style="display:flex;align-items:center;gap:8px;pointer-events:none"><span class="placeholder">Access code</span></span>
        <input id="code" name="code" type="password" aria-label="Access code" autofocus required spellcheck="false" autocapitalize="off" />
      </label>
      <button type="submit">Open the piano</button>
      <p class="hint" id="hint">Every letter you type plays a note.</p>
    </form>
  </main>
<script>
  var failed = document.body.className.indexOf('failed') >= 0;
  var hint = document.getElementById('hint');
  if (failed) { hint.textContent = "That code didn't open it. Check the spelling and try again."; hint.className = 'hint error'; }
  var colors = ['#FFD1E4','#FFD9B8','#FFEDA8','#C6F2D0','#BDF1F4','#BFE0FF'];
  var scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  var input = document.getElementById('code');
  var dots = document.getElementById('dots');
  var ctx = null;
  function tone(i) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      var f = 440 * Math.pow(2, (60 + scale[i % scale.length] - 69) / 12);
      var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 1);
    } catch (e) {}
  }
  function render() {
    var n = input.value.length;
    dots.innerHTML = '';
    if (!n) { dots.innerHTML = '<span class="placeholder">Access code</span>'; return; }
    for (var i = 0; i < Math.min(n, 18); i++) {
      var d = document.createElement('span'); d.className = 'dot'; d.style.background = colors[i % colors.length]; dots.appendChild(d);
    }
    var c = document.createElement('span'); c.className = 'caret'; dots.appendChild(c);
  }
  var last = 0;
  input.addEventListener('input', function () {
    if (input.value.length > last) tone(input.value.length - 1);
    last = input.value.length; render();
  });
  render();
</script>
</body>
</html>`;
