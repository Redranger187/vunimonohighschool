// Cloudflare Pages Function: GitHub OAuth bridge for Decap CMS.
// Configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET as Cloudflare secrets.
// Create a GitHub OAuth App whose callback URL is https://YOUR_DOMAIN/callback
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = url.origin;
  const redirectUri = `${origin}/callback`;

  if (url.pathname === '/auth') {
    const state = crypto.randomUUID();
    const auth = new URL('https://github.com/login/oauth/authorize');
    auth.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    auth.searchParams.set('redirect_uri', redirectUri);
    auth.searchParams.set('scope', 'repo,user:email');
    auth.searchParams.set('state', state);
    return new Response(null, { status: 302, headers: {
      Location: auth.toString(),
      'Set-Cookie': `decap_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
    }});
  }

  if (url.pathname === '/callback') {
    const state = url.searchParams.get('state');
    const code = url.searchParams.get('code');
    const cookie = request.headers.get('Cookie') || '';
    const saved = cookie.match(/(?:^|; )decap_oauth_state=([^;]+)/)?.[1];
    if (!state || !code || !saved || state !== saved) return new Response('OAuth state validation failed.', {status: 400});

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: {'Accept':'application/json','Content-Type':'application/json'},
      body: JSON.stringify({client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: redirectUri, state})
    });
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) return new Response('GitHub did not return an access token.', {status: 502});

    const token = JSON.stringify({token: tokenData.access_token});
    const html = `<!doctype html><html><body><script>window.opener.postMessage('authorization:github:success:${token.replace(/</g,'\\u003c')}', '${origin}');window.close();</script><p>Authentication complete. You may close this window.</p></body></html>`;
    return new Response(html, {headers: {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'}});
  }
  return new Response('Not found', {status:404});
}
