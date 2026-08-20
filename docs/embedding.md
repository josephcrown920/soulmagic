# Embedding Soul Studio in Aurora

Soul Studio exposes its real creation workspace at `/embed`. The regular
`/studio` route remains unchanged and keeps its full Soul navigation.

## Required deployment configuration

Set both variables to Aurora Global's exact published origin, with no path:

```text
AURORA_EMBED_ALLOWED_ORIGINS=https://aurora.example.com
VITE_AURORA_EMBED_ALLOWED_ORIGINS=https://aurora.example.com
```

`AURORA_EMBED_ALLOWED_ORIGINS` generates the production `frame-ancestors`
policy. The Vite-prefixed copy limits ready and resize messages to the same
trusted parent. Comma-separate multiple origins only when a separate production
or staging Aurora deployment is intentionally supported.

Soul does not accept an Aurora session token. It retains its own Supabase
session and opens sign-in in a top-level tab when an embedded user is not
already authenticated.