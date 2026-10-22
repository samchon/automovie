# Screenshots

Honor the [explicit-shutdown rule](SKILL.md#human). One Vite service serves the interactive Human page and the PNG URLs; every PNG is drawn by that same page, `packages/playground/human.html`, in a resident headless Chrome.

## Startup

The [execution owner](SKILL.md#work-allocation) starts the service from the repository root with Node 22.23.2 or later, only when service operation is authorized:

```powershell
Set-Location packages/playground
$env:AUTOMOVIE_HUMAN_IMAGE_REGISTRY = (Resolve-Path human-images.json).Path
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort
```

- Keep it running across edits. A change to the Vite config or a plugin module it imports, such as `HumanImageSession.ts`, makes Vite restart its server in-process, which also retires the worker and its Chrome. A change to `humanImageProcessEntry.ts` alone is not imported by the config, so requests answer 503 "operator restart required" until the execution owner restarts the service. A Human generator or page change needs no restart: the next request sees a new source hash, regenerates and reloads the worker's tab.
- The first PNG after a start takes about 17 s (Chrome launch, Vite module transform, generation). A new frame of the current model then takes 1 to 2 s, a frame of another person about 5 s (the in-page generator itself about 0.7 s, the rest building and publishing the model JSON), and a cache hit about 1.5 s, mostly source hashing. After a worker crash the next request starts a new worker in about 10 s.
- The worker needs Google Chrome (`CHROME` overrides the path) with hardware WebGL. It refuses a software renderer such as SwiftShader, because the reference photographs come from ANGLE Direct3D 11.
- Model errors never authorize a restart; follow [failure isolation](verification.md#actual-generated-form). Verify the 3D page, parameter JSON and a decoded PNG after any recovery; HTTP 200 alone proves nothing.
- `AUTOMOVIE_HUMAN_AUDIT_IMPORT` imports one manifest path or a JSON array of at most two into the archive; import never renders or changes a capture time.

## Human Page

Open `http://127.0.0.1:5173/human.html?alias=f1`. The page generates from the typed module `src/human-parameters/f1.ts`; `?document=<json url>` generates only when that JSON equals a registered typed example, and edited parameters are refused. A failed generation leaves an empty viewport with the error, never an old model.

| Variable | Values | Effect |
| --- | --- | --- |
| `alias` | `f1`, `f2`, `m1`, `m2` | Person to generate |
| `pass` | `surface`, `overlay`, `construction` | Shown parts, see [Passes](#passes) |
| `camera` | a [camera](#cameras) name | Places the orbit camera on that capture camera |
| `curves` | a [curve selection](#curve-selection) | Highlights curves and the skin they shape |

The page keeps these variables in its address and links the PNG URL of the same view; "PNG URL 복사" copies it. The toolbar legend shows the axis, section and selection colours. Orbit with the mouse; a click without dragging in `overlay` or `construction` adds or removes the curve under the pointer. `window.__automovieHuman` exposes `loadAlias`, `load`, `setPass`, `setCamera`, `setCurves`, `curves`, `capture`, `serialize` and `snapshot`.

## Parameters And Aliases

| Alias | Typed parameter source | Parameter URL |
| --- | --- | --- |
| f1 | `packages/playground/src/human-parameters/f1.ts` | `/human-parameters/f1.json` |
| f2 | `packages/playground/src/human-parameters/f2.ts` | `/human-parameters/f2.json` |
| m1 | `packages/playground/src/human-parameters/m1.ts` | `/human-parameters/m1.json` |
| m2 | `packages/playground/src/human-parameters/m2.ts` | `/human-parameters/m2.json` |

- `human-images.json` maps each alias to its TS module; `/human-parameters/<alias>.json` and `/human-images/<alias>.json` serialize that typed value, and no JSON copy is authoritative.
- Matching reference outputs are `test/.shots/{f1,f2,m1,m2}/`; [References](references.md#reference-addresses) distinguishes aliases from permanent request identities. The generator never reads them as a shape fallback.
- Additional reference acquisition under [References](references.md#add-or-resume-a-reference) does not publish a viewer alias.

## Human URL Catalog

Base URL: `http://127.0.0.1:5173`. A PNG URL is `/human-images/<alias>/<camera>.<pass>.png`, optionally with `?fresh=<nonce>`, `curves=<selection>` and `receipt=1`, for example `/human-images/f1/whole-front.overlay.png?fresh=r12-f1-front&curves=finger.left.*,trunk/7`.

| Purpose | Path |
| --- | --- |
| Generated `{ parameters, model }` JSON | `/human-images/f1.model.json` |
| PNG, cached if this model already drew it | `/human-images/f1/whole-front.surface.png` |
| New frame | append `?fresh=<unique nonce>` |
| Capture receipt | append `&receipt=1` to a fresh URL |
| PNG of a pinned model key | `/human-images/current/<model-key>/whole-front.surface.png` |
| Historical index | `/human-images/archive.json` |
| Retained PNG or receipt | `/human-images/archive/<capture-digest>.png`, `?receipt=1` |

Every PNG is 1200 x 1200 at pixel ratio 1 with the reference conditions: background `#f1f3f6`, `HemisphereLight(0xffffff, 0x9aa3b2, 0.6)`, a 2.2 key light at a fixed camera-relative offset, fov 30, and the model's own linear gray 0.8 material with roughness 0.9. A generated frame therefore compares 1:1 with the reference photograph of the same direction. The receipt and metadata record the camera placement, bounds, pass, curve selection, visible parts, WebGL renderer and model key.

## Cameras

Each camera looks at the centre of its region from the named direction and backs off until all region corners fit with a 15 percent margin, as the reference capture did. Azimuth runs from +X toward +Z in the registered frame (forward +X, up +Y, lateral +Z).

| Camera | Direction | Region |
| --- | --- | --- |
| `whole-front` | +X | whole surface bounds |
| `whole-back` | −X | whole surface bounds |
| `whole-left` | +Z | whole surface bounds |
| `whole-right` | −Z | whole surface bounds |
| `whole-oblique-front` | +X+Z, 45° | whole surface bounds |
| `whole-oblique-back` | −X−Z, 45° | whole surface bounds |
| `region-row{0..3}-front` | +X | one quarter of the height, row 0 lowest |
| `region-row{0..3}-side` | +Z | one quarter of the height, row 0 lowest |
| `head-front` | +X | head close-up |
| `head-side` | +Z | head close-up |
| `head-back` | −X | head close-up |
| `head-oblique-front` | +X+Z, 45° | head close-up |
| `eye-left-front` | +X | `human.eye.left.` parts plus margin |
| `eye-right-front` | +X | `human.eye.right.` parts plus margin |

Region rows keep the whole lateral extent, so with arms out a row frames far more than its quarter; they are bounds tiles, not anatomical cuts.

Close-ups frame the model's own parts, never fixed coordinates. A head close-up frames the `human.skin.head/` intervals together with every `human.hair.` and `human.eye.` part, so hair and eyes are never cropped; the generator's head chain is used because a neck-base height is not a published quantity. An eye close-up frames that side's `human.eye.<side>.` parts grown on every side by 0.75 of their largest extent, so lids and brow stay in view and the eye spans about a third of the frame. A model without those parts fails the request instead of framing something else. For any other close-up, orbit and zoom on the page.

## Passes

Parts whose id starts with `human.construction.` are construction (the lofting curves); every other part, such as the `human.skin.<chain>/<k>` intervals, hair and eyes, is surface. All passes of one camera share the surface-derived region, so they align pixel for pixel.

- `surface`: skin alone.
- `overlay`: skin and lofting curves. The skin is drawn with a polygon offset of one, so sections lying on it win the depth test; axes run inside the body and are drawn through the skin.
- `construction`: lofting curves alone.

Curves are drawn unlit in the generator's material colours, central axes (`<chain>/axis`) red and sections (`<chain>/<k>`) blue, so lighting never washes them out. Axes are thickened by 1/600 of the body height so they read as thicker than sections. These display rules live in the page's styling closure, `createHumanPartStyle`, applied through the generic `ModelPartStyling`; the generator's model is not changed.

A model without construction parts fails `overlay` and `construction` requests explicitly instead of returning a surface image.

## Curve Selection

A curve id is a construction part id without `human.construction.`: `<chain>/<k>` for the principal section at layer k, or `<chain>/axis` for the chain's central axis. Chains are `upper`, `trunk`, `leg.left`, `arm.left`, `thumb.left`, `hand.left.1` to `hand.left.3`, `finger.left.index`, `finger.left.middle`, `finger.left.ring`, `finger.left.little` and their `right` counterparts. Skin parts are `human.skin.<chain>/<k>`, the band between layers k and k+1.

- `curves` is a comma list of ids and `*` globs, where `*` matches any characters including `.` and `/`; `finger.left.*` selects every curve of the left fingers.
- A pattern that matches no curve of the model fails the request; a malformed one returns 400.
- Section `<chain>/<k>` shapes skin `<chain>/<k-1>` and `<chain>/<k>`; `<chain>/axis` shapes every interval of that chain, not of its child chains.
- Selected curves turn green, a third colour, and thicken by a further 1/800 of the body height. `surface` tints the shaped skin halfway to green; `overlay` tints it and draws the green curves; `construction` draws them over all other curves. Selected axes stay visible through the skin.
- The canonical selection (trimmed, deduplicated, sorted) is part of the frame cache, archive lookup, `x-human-curves` header and receipt.

## Freshness And Failures

- Use a unique `fresh` nonce of one to sixty-four letters, digits, `_` or `-` per new frame. A nonce already in the archive returns its historical bytes; a URL without `fresh` may return a cached frame of the current model.
- Check `x-human-captured-utc`, `x-human-png-sha256`, `x-human-identity`, `x-human-cache`, `x-human-binding` and `x-human-curves`. `new-requested-frame` means drawn now, `existing-png` means reused, and `historical-generation` proves only the original computation.
- The archive keeps sixteen PNG and receipt pairs within 64 MiB; preserve report copies before eviction. 410 means an expired archive entry, 409 a stale pinned model key, 503 a source or host change during the request (retry), 500 a generation or render failure whose cause is in the server log.
- None of these statuses permits passing an old image off as new. Follow the [audit requirements](verification.md#audit-and-user-reports).

## User-Facing Image Reports

1. Save each inspected PNG's exact HTTP bytes under `packages/playground/.shots/<round>/`, which git ignores, never under `test/.shots`.
2. Check the file's SHA-256 against `x-human-png-sha256` and keep the captured UTC, receipt and model key.
3. Open the local PNG, then embed its absolute path in Markdown, one image at a time outside tables, with its URL for developer access.

A save or delivery time is not a capture time. Remove report copies that no longer serve a report.
