# Cloudflare Access

Use a Cloudflare Quick Tunnel to open the locally running app from any network
without deploying it.

## Start

```bash
./scripts/cloudflare-tunnel.sh start
```

The script prints a public HTTPS URL such as:

```text
https://example-words.trycloudflare.com
```

Open that URL on the iPhone. The Mac must be awake, online and running:

```bash
npm run build
npm run start -- -p 3000
```

## Supabase URL configuration

In **Authentication → URL Configuration** add the tunnel URL and its wildcard:

```text
https://<quick-tunnel>.trycloudflare.com
https://<quick-tunnel>.trycloudflare.com/**
```

Keep these as well for local access:

```text
http://localhost:3000
http://localhost:3000/**
http://192.168.1.134:3000
http://192.168.1.134:3000/**
```

Google OAuth only needs the Supabase callback:

```text
https://upkiivhuxgvrjtkorvbi.supabase.co/auth/v1/callback
```

The LAN IP must not be added to Google's Authorized JavaScript origins.
The tunnel HTTPS origin is a normal public origin and can be added there if
Google asks, but the Supabase redirect flow does not require it.

## Important limitations

- The Quick Tunnel URL changes every time the tunnel restarts. Update Supabase
  whenever the URL changes.
- The app stays available only while the Mac is awake and online.
- Anyone with the URL can open the app shell. Account data remains protected by
  Supabase Auth and RLS, but the legacy shared `homes` table is still readable.
- For a stable hostname that survives restarts, create a named Cloudflare
  Tunnel and route a domain you control to `http://localhost:3000`.
- If the Mac cannot resolve `*.trycloudflare.com`, use Cloudflare DNS
  (`1.1.1.1` / `1.0.0.1`) or test over cellular. Some router DNS resolvers
  return NXDOMAIN for Quick Tunnel hostnames.

## Stop

```bash
./scripts/cloudflare-tunnel.sh stop
```
