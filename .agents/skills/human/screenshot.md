# Screenshots

One shared viewer serves every agent, and every agent captures from it by HTTP. The Integration subagent starts it from the repository root, on another free port with `--strictPort` when 5173 is taken:

```powershell
Set-Location packages/playground
$env:AUTOMOVIE_HUMAN_IMAGE_REGISTRY = (Resolve-Path human-images.json).Path
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort
```

| Use | URL under `http://127.0.0.1:5173` |
| --- | --- |
| Interactive page | `/human.html?alias=f1` |
| 3D PNG | `/human-images/<alias>/<camera>.<pass>.png?fresh=<nonce>&...` |
| 2D curve diagram | `/human-curves/<alias>.png?fresh=<nonce>&curves=...` |

## Free View

| Variable | Values |
| --- | --- |
| `alias` | `f1`, `f2`, `m1`, `m2` |
| `pass` | `surface`, `overlay`, `construction` |
| `camera` | `whole-front`, `whole-back`, `whole-left`, `whole-right`, `head-front`, `free`, and the rest in the page's camera menu |
| `curves` | `<chain>/<k>`, `<chain>/axis` or `<chain>/g<j>`, with `*` globs, repeatable |
| `isolate=1`, `fit=selection` | draw or frame only the selected curves and the skin they shape |
| `garment=0`, `hair=0` | hide underwear or hair |
| `material=clay` | plain geometry material |
| `light` | `raking-left`, `raking-right` |
| `az`, `el`, `view`, `target`, `dist`, `ortho=1` | free camera in degrees and mm; `view` is `+x` to `-z`, with `+` written `%2B` |
| `fresh` | nonce of letters, digits, `_` or `-` |

- Give every new frame a unique `fresh` nonce.
- Accept a frame as new only when `x-human-cache` is `new-requested-frame`.
- Keep its `x-human-captured-utc` and `x-human-png-sha256` headers.

## References

Reference outputs live in `test/.shots/<alias>/`, selected by `test/.shots/manifest.json`: `captures.json` indexes the original photographs, `recovery/screenshots/index.json` the Recovery renders, and `hermite-curves.json.gz` holds the saved curves.
