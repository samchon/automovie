# Screenshots

Honor the [explicit-shutdown rule](SKILL.md#human). The Human contract stub implements neither generation nor a render service. The interface below requires implementation and runtime verification; documented paths do not establish a working service.

## User-Facing Image Reports

1. Preserve each inspected HTTP PNG's exact bytes outside canonical `test/.shots`, for example `test/.human-audit-reports/<round>/`.
2. Verify local SHA against the response; retain captured UTC, receipt and code/input/output binding.
3. Open the local PNG and embed its absolute path in Markdown, one image at a time outside tables. Keep the URL for developer access.

Historical delivery or local-save time is not a new capture. Preserve report evidence while needed; remove unrelated scratch files after use.

## Existing Human Page And Abbreviated PNG URLs

The shared owner must verify service and parameter wiring before relying on this startup command. Run from the repository root with Node 22.23.2 or later only when service operation is authorized:

```powershell
Set-Location packages/playground
$env:AUTOMOVIE_HUMAN_IMAGE_REGISTRY = (Resolve-Path human-images.json).Path
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort
```

- Confirm the actual Node version. Model errors never authorize restart; follow [failure isolation](verification.md#actual-generated-form).
- Recovery import: `AUTOMOVIE_HUMAN_AUDIT_IMPORT` accepts one manifest path or a JSON array of at most two, using actual retained PNG/producer evidence. Import does not render or change capture time.
- Verify the 3D page, parameter JSON and actual decoded PNG after recovery. HTTP 200 alone is insufficient.
- This is a development Vite service, not static-hosted rendering. Shared camera descriptors do not guarantee browser WebGL/native WebGPU pixel or material identity.

## Parameters And Aliases

| Alias | Typed parameter source | Parameter URL |
| --- | --- | --- |
| f1 | `packages/playground/src/human-parameters/f1.ts` | `/human-parameters/f1.json` |
| f2 | `packages/playground/src/human-parameters/f2.ts` | `/human-parameters/f2.json` |
| m1 | `packages/playground/src/human-parameters/m1.ts` | `/human-parameters/m1.json` |
| m2 | `packages/playground/src/human-parameters/m2.ts` | `/human-parameters/m2.json` |

- Each typed example is checked against `IAutoMovieHumanParameters`. `human-images.json` selects these TS modules; no public parameter-JSON copy is authoritative.
- `/human-parameters/{alias}.json` and `/human-images/{alias}.json` use the same `HumanImageRegistry` reader and serialized typed value. Verify actual HTTP bytes before claiming a running service.
- Matching reference outputs are `test/.shots/{f1,f2,m1,m2}/`; [References](references.md#reference-addresses) distinguishes aliases from permanent request identities.
- Use these same parameters for new reference requests through the verified supply bridge; the final Human generator must not read reference artifacts as a shape fallback.
- Automatic local PNG preservation requires actual byte/SHA/UTC verification; documented paths alone certify no completed output.
- Preserve numerical inputs and units. Source-conditioned sample reconstruction is not independent parameter-model completion.
- Additional reference acquisition under [References](references.md#add-or-resume-a-reference) does not automatically publish a viewer alias.

## Human URL Catalog

Base URL: `http://127.0.0.1:5173`. The single page is `/human.html?alias=f1`; change alias to f2/m1/m2. Explicit `?document=/human-parameters/f1.json` uses the same page; avoid conflicting selectors.

| Purpose | Path or method |
| --- | --- |
| Public parameters | `/human-parameters/f1.json` |
| Registry-admitted parameters | `/human-images/f1.json` |
| Generated model/construction | `/human-images/f1.model.json` |
| Edited JSON generation | `POST /human-images/model.json` |
| Current PNG | `/human-images/f1/whole-front.surface.png` |
| New frame request | `/human-images/f1/whole-front.surface.png?fresh=unique-round-f1-front` |
| Capture receipt | Append `&receipt=1` to that fresh URL |
| Accepted-model PNG | `/human-images/current/<model-key>/whole-front.surface.png` |
| Historical index | `/human-images/archive.json` |
| Retained PNG/receipt | `/human-images/archive/<capture-digest>.png`, append `?receipt=1` for receipt |

- Copy actual keys/digests from viewer/index. Model JSON or cache misses can trigger expensive generation; no fixed latency is guaranteed.
- Change person in alias, camera in filename and pass to `surface`, `overlay` or `construction`.
- Camera names below are proposed interface conventions, not implemented presets. Region rows do not establish anatomical cuts or dedicated close-ups.

| Camera | Actual placement/target | Surface URL | Overlay URL | Construction URL |
| --- | --- | --- | --- | --- |
| `whole-front` | +X; 50% height | [PNG](http://127.0.0.1:5173/human-images/f1/whole-front.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/whole-front.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/whole-front.construction.png) |
| `whole-back` | −X; 50% height | [PNG](http://127.0.0.1:5173/human-images/f1/whole-back.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/whole-back.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/whole-back.construction.png) |
| `whole-left` | +Z; 50% height | [PNG](http://127.0.0.1:5173/human-images/f1/whole-left.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/whole-left.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/whole-left.construction.png) |
| `whole-right` | −Z; 50% height | [PNG](http://127.0.0.1:5173/human-images/f1/whole-right.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/whole-right.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/whole-right.construction.png) |
| `whole-oblique-front` | +X/+Z; 50% height | [PNG](http://127.0.0.1:5173/human-images/f1/whole-oblique-front.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/whole-oblique-front.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/whole-oblique-front.construction.png) |
| `whole-oblique-back` | −X/−Z; 50% height | [PNG](http://127.0.0.1:5173/human-images/f1/whole-oblique-back.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/whole-oblique-back.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/whole-oblique-back.construction.png) |
| `region-row0-front` | +X; 12.5% height | [PNG](http://127.0.0.1:5173/human-images/f1/region-row0-front.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row0-front.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row0-front.construction.png) |
| `region-row0-side` | +Z; 12.5% height | [PNG](http://127.0.0.1:5173/human-images/f1/region-row0-side.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row0-side.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row0-side.construction.png) |
| `region-row1-front` | +X; 37.5% height | [PNG](http://127.0.0.1:5173/human-images/f1/region-row1-front.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row1-front.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row1-front.construction.png) |
| `region-row1-side` | +Z; 37.5% height | [PNG](http://127.0.0.1:5173/human-images/f1/region-row1-side.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row1-side.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row1-side.construction.png) |
| `region-row2-front` | +X; 62.5% height | [PNG](http://127.0.0.1:5173/human-images/f1/region-row2-front.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row2-front.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row2-front.construction.png) |
| `region-row2-side` | +Z; 62.5% height | [PNG](http://127.0.0.1:5173/human-images/f1/region-row2-side.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row2-side.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row2-side.construction.png) |
| `region-row3-front` | +X; 87.5% height | [PNG](http://127.0.0.1:5173/human-images/f1/region-row3-front.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row3-front.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row3-front.construction.png) |
| `region-row3-side` | +Z; 87.5% height | [PNG](http://127.0.0.1:5173/human-images/f1/region-row3-side.surface.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row3-side.overlay.png) | [PNG](http://127.0.0.1:5173/human-images/f1/region-row3-side.construction.png) |

## Freshness And Failures

- Use a unique safe `fresh` nonce per new frame. Existing admitted nonces can return historical bytes; missing mutable requests can render.
- Check `x-human-captured-utc`, `x-human-png-sha256`, `x-human-identity`, `x-human-cache`, `x-human-binding` and receipt.
- `new-requested-frame` means rendered now; `existing-png` means reused. `historical-generation` proves original computation, not current-source shape.
- Archive bounds: sixteen PNG/receipt pairs, 64 MiB. Preserve report copies before eviction.
- 410 means expired archive without regeneration; 409 means stale current identity, requiring reload; 503 may identify source/host transition with `Retry-After`.
- None of these statuses permits passing old images off as new. Follow [audit requirements](verification.md#audit-and-user-reports).
