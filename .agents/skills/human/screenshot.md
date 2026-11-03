# Screenshots

Use the task's Human development viewer endpoint, by default `http://127.0.0.1:5196`. After verifying ownership, start, stop or restart a task-owned server as needed without approval, and leave other owners' services running. Start the application in `packages/human/dev` from the repository root:

```powershell
pnpm --filter @automovie/human dev
```

The default registry is `packages/human/dev/human-images.json`. The [development README](../../../packages/human/dev/README.md) documents explicit registry overrides. Generation and capture do not wait for the type check, so parallel workers can inspect while another's edit is still red; collect compile errors beside the server with `pnpm --filter @automovie/human exec ttsc --noEmit --watch -p dev/tsconfig.json`.

| Use | Path under the viewer endpoint |
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
| `material` | `clay` for plain geometry, `appearance` for skin, hair and eyes |
| `light` | `raking-left`, `raking-right`, `reference` |
| `pose` | `neutral`, `demo`, `limit` |
| `az`, `el`, `view`, `target`, `dist`, `ortho=1` | free camera in degrees and mm; `view` is `+x` to `-z`, with `+` written `%2B` |
| `fresh` | nonce of letters, digits, `_` or `-` |

- Give every new frame a unique `fresh` nonce.
- Accept a frame as new only when `x-human-cache` is `new-requested-frame`.
- Keep its `x-human-captured-utc`, `x-human-png-sha256` and `x-human-source-sha256` headers; the last names the source the frame reflects.

## Part View

View one piece or part alone in the component page of the development viewer. It shows a supplied document of parts with their surfaces and generating curves, and every option is a URL variable: the visibility and colour of each part, the visibility, thickness and colour of each curve, the camera, the shading, the raking light and the section. Build the document from a piece's standalone entry with fixed inputs, so a piece is seen in seconds without generating the whole body. The [development README](../../../packages/human/dev/README.md) lists the variables and the entry contract.

## Running

- Start the viewer with the command above and collect type errors from a `ttsc --noEmit --watch` run beside it, so a red file never stops a capture.
- A frame's `x-human-source-sha256` is the source hash at module load, and a later save does not change a frame already made; a retry count above one shows a save during loading.

## References

Reference outputs live in `test/.shots/<alias>/`, selected by `test/.shots/manifest.json`: `captures.json` indexes the original photographs, `recovery/screenshots/index.json` the Recovery renders, and `hermite-curves.json.gz` holds the saved curves.
