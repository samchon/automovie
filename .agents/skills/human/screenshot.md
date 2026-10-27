# Screenshots

Honor the [explicit-shutdown rule](SKILL.md#human). One Vite service serves the interactive Human page, the 3D PNG URLs and the 2D curve diagrams; every image is drawn by that same page, `packages/playground/human.html`, in a resident headless Chrome.

## Startup

The [Integration subagent](SKILL.md#subagents-by-body-part) starts the service from the repository root with Node 22.23.2 or later, only when service operation is authorized:

```powershell
Set-Location packages/playground
$env:AUTOMOVIE_HUMAN_IMAGE_REGISTRY = (Resolve-Path human-images.json).Path
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort
```

- Keep it running across edits. A change to the Vite config or a plugin module it imports, such as `HumanImageSession.ts`, makes Vite restart its server in-process, which also retires the worker and its Chrome; two such edits within a second can crash Vite with `ERR_SERVER_ALREADY_LISTEN`, after which the service must be started again. A change to `humanImageProcessEntry.ts` alone is not imported by the config, so requests answer 503 "operator restart required" until the execution owner restarts the service. A Human generator or page change needs no restart: the next request sees a new source hash, regenerates and reloads the worker's tab.
- The first PNG after a start takes 15 to 30 s (Chrome launch, Vite module transform, generation). A new frame of the current model then takes about 1 s, another person or a source change a full regeneration, a cache hit about 1.5 s, and a 2D diagram about 1 s.
- The worker needs Google Chrome (`CHROME` overrides the path) with hardware WebGL. It refuses a software renderer such as SwiftShader, because the reference photographs come from ANGLE Direct3D 11.
- Model errors never authorize a restart; follow [failure isolation](verification.md#actual-generated-form). Verify the 3D page, parameter JSON and a decoded PNG after any recovery; HTTP 200 alone proves nothing.
- Keep unfinished source and calibration changes outside the live import graph until their complete dependency set is ready. A partial edit must not disable the viewer while modeling continues. Preserve the work, restore a complete active revision when needed and identify that revision honestly in capture evidence; never substitute an old PNG or hide a generation failure behind an old model.
- `AUTOMOVIE_HUMAN_AUDIT_IMPORT` imports one manifest path or a JSON array of at most two into the archive; import never renders or changes a capture time.

## Human Page

Open `http://127.0.0.1:5173/human.html?alias=f1`. The page generates from the typed module `src/human-parameters/f1.ts`; `?document=<json url>` generates only when that JSON equals a registered typed example, and edited parameters are refused. A failed generation leaves an empty viewport with the error, never an old model.

| Variable | Values | Effect |
| --- | --- | --- |
| `alias` | `f1`, `f2`, `m1`, `m2` | Person to generate |
| `pass` | `surface`, `overlay`, `construction` | Shown parts, see [Passes](#passes) |
| `camera` | a [camera](#cameras) name | Base direction and region |
| `curves` | a [curve selection](#curve-selection) | Colours the selected curves and the skin they shape |
| `isolate`, `fit`, `garment`, `hair`, `material`, `light`, `az`, `el`, `view`, `target`, `dist`, `ortho` | see [Free View](#free-view) | Isolation, appearance inspection and free camera |

The page writes these variables back into its address and links the PNG URL of the same view; "PNG URL 복사" copies it and "곡선 도면" opens the 2D diagram of the selection. The toolbar has the pass, camera and free-view controls and a legend of the axis, section and selected-curve colours. Orbit with the mouse; a click without dragging in `overlay` or `construction` adds or removes the curve under the pointer. `window.__automovieHuman` exposes `loadAlias`, `load`, `setPass`, `setCamera`, `setCurves`, `setView`, `curves`, `capture`, `diagram`, `serialize` and `snapshot`.

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

Base URL: `http://127.0.0.1:5173`. A 3D PNG URL is `/human-images/<alias>/<camera>.<pass>.png`, optionally with `fresh=<nonce>`, `curves=`, the [free-view](#free-view) variables and `receipt=1`.

| Purpose | Path |
| --- | --- |
| Generated `{ parameters, model }` JSON | `/human-images/f1.model.json` |
| PNG, cached if this model already drew it | `/human-images/f1/whole-front.surface.png` |
| New frame | append `?fresh=<unique nonce>` |
| Capture receipt | append `&receipt=1` to a fresh URL |
| PNG of a pinned model key | `/human-images/current/<model-key>/whole-front.surface.png` |
| 2D curve diagram | `/human-curves/f1.png?curves=...`, see [Curve Diagrams](#curve-diagrams) |
| Historical index | `/human-images/archive.json` |
| Retained PNG or receipt | `/human-images/archive/<capture-digest>.png`, `?receipt=1` |

Examples:

- `/human-images/f1/whole-front.overlay.png?fresh=r12-front&curves=finger.left.*&curves=trunk/7`
- `/human-images/f1/free.overlay.png?fresh=r12-crotch&curves=trunk/0&isolate=1&fit=selection&view=%2By&ortho=1`
- `/human-curves/f1.png?fresh=r12-head&curves=head@1500:1535:5`

Every 3D PNG is 1200 x 1200 at pixel ratio 1. Default reference conditions are background `#f1f3f6`, `HemisphereLight(0xffffff, 0x9aa3b2, 0.6)`, a 2.2 key light at a fixed camera-relative offset, fov 30, and the model's own materials. Without `curves` and free variables a frame compares 1:1 with the reference photograph of the same direction. A frame with a selection carries a legend box listing each curve id in its colour. The receipt and metadata record the camera placement and projection, bounds, pass, curve selection with colours, free view, visible parts, WebGL renderer and model key.

## Cameras

Each camera looks at the centre of its region from the named direction and backs off until all region corners fit with a 15 percent margin, as the reference capture did. Azimuth runs from +X toward +Z in the registered frame (forward +X, up +Y, lateral +Z).

| Camera | Direction | Region |
| --- | --- | --- |
| `free` | +X | whole surface bounds; the base for [free view](#free-view) |
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

Close-ups frame the model's own parts, never fixed coordinates. A head close-up frames the skin of the head chain family (`human.skin.head/` and every sub-chain `human.skin.head.*`) and the ear chains (`human.skin.ear.*`), together with every `human.hair.` and `human.eye.` part, so hair, ears and eyes are never cropped; chain names are used because a neck-base height is not a published quantity. An eye close-up frames that side's `human.eye.<side>.` parts grown on every side by 0.75 of their largest extent. A model without those parts fails the request instead of framing something else.

## Free View

These variables modify the named camera on the page and in PNG URLs alike; their canonical text is part of the frame cache, archive lookup, `x-human-view` header and receipt.

| Variable | Effect |
| --- | --- |
| `az=<deg>`, `el=<deg>` | Direction: azimuth from +X toward +Z, elevation toward +Y in [-90, 90] |
| `view=+x\|-x\|+y\|-y\|+z\|-z` | Camera on that axis; write `+` as `%2B` in a URL; not combined with `az`/`el` |
| `target=x,y,z` | Look-at point in mm, registered frame of the generated model |
| `dist=<mm>` | Camera distance from the target; absent fits the region |
| `ortho=1` | Orthographic projection: `el=90` (`view=+y`) shows a horizontal section in true shape with +X right and +Z down; `el=0` shows an axis in profile |
| `isolate=1` | Draw only the `curves` selection and, outside the `construction` pass, the skin intervals it shapes, in the skin's own colour |
| `fit=selection` | Frame the selected curves and the skin they shape instead of the camera region |
| `garment=0` | Hide the underwear parts (`human.garment.`) to inspect the bare body; absent or `garment=1` shows them, the default, because every image shown outside development wears them. Framing is unchanged, so frames with and without align pixel for pixel |
| `hair=0` | Hide scalp hair, brows and lashes (`human.hair.`) to inspect covered contacts; absent or `hair=1` shows them |
| `material=clay` | Inspect geometry with fine skin material effects disabled; eye and nail materials retain their appearance. Absent or `material=appearance` uses the assembled materials |
| `light=raking-left` or `light=raking-right` | Inspect surface continuity under tangential light; absent uses the reference lighting |

`isolate` and `fit` need a non-empty `curves`; `isolate` also hides the garments. Malformed values return 400.

Specifying only `el` preserves the named camera's azimuth. Match all display conditions across a shape comparison; switching material or light is an inspection condition, not evidence of a geometry correction.

## Passes

Parts whose id starts with `human.construction.` are construction (the lofting curves); every other part, such as the `human.skin.<chain>/<k>` intervals, hair and eyes, is surface. All passes of one camera share the surface-derived region, so they align pixel for pixel.

- `surface`: skin and appearance parts (eyes, hair, garments).
- `overlay`: skin and lofting curves. The skin is drawn with a polygon offset of one, so sections lying on it win the depth test; axes run inside the body and are drawn through the skin.
- `construction`: lofting curves alone.

Curves are drawn unlit in the generator's material colours, central axes (`<chain>/axis`) red, sections (`<chain>/<k>`) blue and guides (`<chain>/g<j>`) green. Axes are thickened by 1/600 of the body height so they read as thicker than sections. These display rules live in the page's styling closure, `createHumanPartStyle`, applied through the generic `ModelPartStyling`; the generator's model is not changed. A model without construction parts fails `overlay` and `construction` requests explicitly instead of returning a surface image.

## Curve Selection

A curve id is a construction part id without `human.construction.`: `<chain>/<k>` for the principal section at layer k, counted from the chain's bottom, `<chain>/axis` for the chain's central axis, or `<chain>/g<j>` for a guide, the fixed-phase Hermite curve carrying the sections along the chain. Chain names contain dots (`finger.left.index`), so only the last `/` separates the layer; the page's curve list shows every id of the current model. Skin parts are `human.skin.<chain>/<k>`, the band between layers k and k+1.

- `curves` takes several values. Repeated keys are canonical (`curves=trunk/7&curves=finger.left.*`), and a comma list inside one value is accepted (`curves=trunk/7,finger.left.*`); both merge in order, trimmed and deduplicated. The page address, copied URLs, receipts and the `x-human-curves` header use repeated keys.
- `*` matches any characters including `.` and `/`. The 2D diagrams additionally accept `<chain>@<mm>` and `<chain>@<from>:<to>:<step>`.
- A pattern that matches no curve of the model fails the request; a malformed one returns 400.
- Section `<chain>/<k>` shapes skin `<chain>/<k-1>` and `<chain>/<k>`; `<chain>/axis` and every guide `<chain>/g<j>` shape every interval of that chain, not of its child chains.
- Each selected curve takes its own colour by list order (globs expand in model order) and thickens by a further 1/800 of the body height; the toolbar and the PNG legend list id and colour. Without `isolate`, shaped skin is tinted halfway to its first curve's colour. `construction` draws the selection over all other curves, and selected axes stay visible through the skin.

## Curve Diagrams

`/human-curves/<alias>.png?curves=...` draws a 1200 x 1200 diagnostic diagram from the generator's calibration in the same resident page, in calibration millimetres; the legend states the alias's model scale. `/human-curves/<alias>/<id>.png` takes the path id as the first curve, and `.svg` returns the source the PNG is rasterized from.

- Sections (`<chain>/<k>`, `<chain>@<mm>`, `<chain>@<from>:<to>:<step>`) share one true-scale frame, each in its own plane (local x right, local z down) and colour, with its curvature comb: spikes along the normal proportional to signed curvature, one scale for all lines with the 95th percentile of |k| at 8 percent of the plot and spikes clipped at three times that. Ringing shows as alternating spikes. Vertex phases are dotted and phase 0 is circled with an arrow toward increasing phase. A series keeps the stations inside the chain and fails only when none is.
- Axes (only `/axis` ids) are plotted as centroid x, centroid z and perimeter against station, with principal layers marked. A list mixing axes and sections is refused.
- The legend gives, per line: id, station, order K, vertex count, perimeter, max |k| with its radius, RMS k and curvature sign changes.
- Headers, `fresh` and `receipt=1` follow the 3D rules (`x-human-png-sha256`, or `x-human-svg-sha256` for `.svg`). Diagrams are not archived; the session keeps the last 32.

## Freshness And Failures

- Use a unique `fresh` nonce of one to sixty-four letters, digits, `_` or `-` per new frame. A 3D nonce already in the archive returns its historical bytes; a URL without `fresh` may return a cached frame of the current model.
- Check `x-human-captured-utc`, `x-human-png-sha256`, `x-human-identity`, `x-human-cache`, `x-human-binding`, `x-human-curves` and `x-human-view`. `new-requested-frame` means drawn now, `existing-png` means reused, and `historical-generation` proves only the original computation.
- The archive keeps sixteen PNG and receipt pairs within 64 MiB; preserve report copies before eviction. 400 means a malformed variable, 410 an expired archive entry, 409 a stale pinned model key, 503 a source or host change during the request (retry), and 500 a generation, render or diagram failure whose cause follows in the body.
- None of these statuses permits passing an old image off as new. Follow the [audit requirements](verification.md#audit-and-user-reports).

## User-Facing Image Reports

1. Save each inspected PNG's exact HTTP bytes under `packages/playground/.shots/<round>/`, which git ignores, never under `test/.shots`.
2. Check the file's SHA-256 against `x-human-png-sha256` and keep the captured UTC, receipt and model key.
3. Open every local PNG. Embed its absolute path in Markdown, one image at a time outside tables with its developer URL, when image delivery is requested; inspection-only audits stay local when the user requests that.

A save or delivery time is not a capture time. Remove report copies that no longer serve a report.

## Human Stickman Page

`http://127.0.0.1:5173/human-stickman.html` shows the rule-derived stickman skeleton (`AutoMovieHumanSkeleton`) of an alias as rods and joint balls, posed by the alias parameters with `pose` set to a demo `IAutoMovieHumanPose` and clamped to the table in `packages/human/docs/anatomy/joint-range.md`. It is a separate page outside the PNG service, so its frames carry no receipt or archive entry; capture it with a page screenshot and save under `packages/playground/.shots/<round>/`.

| Variable | Values | Effect |
| --- | --- | --- |
| `alias` | `f1`, `f2`, `m1`, `m2` | Person whose skeleton is derived; default `f1` |
| `pose` | `rest`, `demo`, `limit` | Demo pose; `demo` exercises every region including fingers and toes, `limit` requests values beyond the range; default `rest` |
| `clamp` | `0` | Applies the pose without clamping; clamping is on by default and the status line lists every clamped field |
| `skin` | `1` | Overlays the neutral skin translucently in rest pose; `garment=0` hides the underwear |
| `view` | `front`, `side`, `back`, `oblique` | Camera direction; default `front` |
