# Human survey

State of `packages/human` on 2026-10-26 (master after [#2992](https://github.com/samchon/automovie/pull/2992)), taken before the redesign of [#2993](https://github.com/samchon/automovie/issues/2993). It is the evidence the redesign plan works from; update it when the facts change.

## Generation path

`AutoMovieHuman.generate(params)`:

1. `AutoMovieHumanBodyLaw.calibrate(params)`: the specimen calibration (`AutoMovieHumanBodyCalibration`) plus the masculine-feminine basis times the control's offset, then the measurement law (`AutoMovieHumanBodyWarpField`, `AutoMovieHumanBodyWarp`) for girths, lengths and head and face sizes, then the event join again.
2. `AutoMovieHumanBodySurface.generate`: every chain lofted between its stations, each event ring generated once by its parent and inherited by its children, poles closed by fans, apertures clipped by position, lids and nostril pockets built on the cut edges; shading normals from the chain surfaces, blended across event rings.
3. `AutoMovieHumanBodyConstruction`: sections, axes and guides as construction parts from the same chain functions.
4. `AutoMovieHumanSkin`: texture chart, albedo, relief and the `human.skin` and `human.cavity` materials.
5. `AutoMovieHumanAppearance`: eyes, brows, lashes, scalp hair, nails, underwear, reading the eye apertures and globes and the head and ear skin parts.
6. Stature scales the whole result uniformly.

## Calibration data

Four regions merge into one calibration (`AutoMovieHumanBodyRegions.merge`): torso (23 chains: neck to legs, arms, hands, digits), foot (17 chains), head (8 chains, the head and the auricles) and eye (2 apertures, 2 globes).

- **Representation.** Every chain is a stack of sections in world-height planes (the lower head and the feet in tilted planes), each a periodic cubic B-spline of 16 to 256 control points, at principal layers with a station slope per coefficient. 51 chains, 25 branch events, 27 poles (fingertips, toetips, lobes, rims, pockets, crown), 4 apertures (two nostrils, two eyes).
- **One section per height carries everything at that height.** The middle head's sections hold the cranium, the face and both auricles in one outline (1543.2 to 1595.5 mm); the helices leave through one ring at 1595.5 mm, and the rims, pockets and lobes are separate chains with layers 0.1 mm apart. The nose and the lips are spread over tens of the lower and middle head's layers.
- **Size.** About 4.9 MB of TypeScript literals: torso 2.4 MB, head 1.1 MB, basis 0.8 MB, foot 0.5 MB. CI's `packages/human` build spends 22 of 24 minutes type-checking and linting them three times.
- **Fit.** Each layer was fitted to one row of the reference's Recovery/Hermite sections. The reference is a densely triangulated mesh, so neighbouring rows 0.5 mm apart differ by up to 0.2 mm of facet noise, which the layers keep. Where a row lost the outline (1586.5 to 1597.5 mm on the head, broken by the palpebral apertures) the fitter interpolated without observations.

## Repairs on the fitted rows

Five rules smooth the fitted rows afterwards, each within a bound, in `AutoMovieHumanBodyCalibration`: section loops (`AutoMovieHumanSectionLoops`), contact low-pass (`AutoMovieHumanContactSmoothing`), lip low-pass (`AutoMovieHumanLipSmoothing`), corner low-pass (`AutoMovieHumanCornerSmoothing`), dense-layer average and C2 slopes (`AutoMovieHumanStationContinuity`). The event join (`AutoMovieHumanEventJoin`) and the ring normal blend in `AutoMovieHumanBodySurface` reconcile independently fitted neighbours. None can tell a fitted corner from noise, and every one exists because rows are stored.

## Shape law

- The basis (`AutoMovieHumanBodyMorphCalibration`, `IAutoMovieHumanBodyMorph`) stores a displacement per chain name and per principal layer, read from the four reference meshes at barycentric addresses (they share one vertex order). Any change of a chain's layers invalidates it until `fitBodyMorph.ts` runs again.
- The measurement law reads named chains (`trunk`, `upper`, `head`, `head.lower`, `head.middle`, `head.upper`, `leg.*`, `arm.*`) and landmarks on them (`AutoMovieHumanBodyGirth`, `AutoMovieHumanBodyLandmarks`).
- Consumed head inputs: head length, cephalic index, face height and width, mandibular width, minimum frontal width. Not consumed by any geometry: nose width, height and protrusion; ear length, breadth and protrusion; mouth width and vermilion heights; palpebral fissure length and height; intercanthal width. Their parts have no module to read them.

## Couplings to chain names

Code that names chains or their part ids, and moves with any change of the chain set: `AutoMovieHumanJointCentres` (trunk, upper, head, head.middle, the crown pole of head.upper), `AutoMovieHumanBodyGirth`, `AutoMovieHumanBodyLandmarks`, `AutoMovieHumanBodyWarpField`, `AutoMovieHumanBodyWarp`, `AutoMovieHumanGarmentBody`, `AutoMovieHumanSkinChart`, `AutoMovieHumanSkinLandmarks`, `AutoMovieHumanSkinMarks`, `AutoMovieHumanSkinTone`, `AutoMovieHumanFaceTone`, scalp hair through `IAutoMovieHumanAppearanceBody.parts` (`human.skin.head*`, `human.skin.ear.*`), and the viewer's close-up framing (`HumanCaptureCamera.ts`: `human.skin.head/`, `human.skin.head.`, `human.skin.ear.`).

## Observations

For each of f1, f2, m1 and m2 under `test/.shots/<alias>/` (private, never committed): the reference mesh (`reference-model.json`, head and body parts, one shared vertex order), its Recovery/Hermite section loft (`hermite-curves.json.gz`, about 50 MB), head and body observations, and the photographs (140 frames of the original mesh, curves and curves over mesh). f1 alone has the dense head rows of `ear-observations/` (horizontal exterior every 0.5 mm, closed horizontal, tilted lower, helix and lobe). Fitters may read the meshes and rows; the generator never reads them.

The head observation (`head-observations.json`) carries the source's own landmarks as vertex lists in millimetres, its lateral axis mirrored against the calibration frame: the lid margins, eye folds and creases, the inner and outer eye corners, the medial and lateral brow ends and brow lines, every ear curve (outer and inner helix, central upper and lower, tragus, antitragus, concha, heel) with the lobule connection point, the upper and lower outer lip contours, philtrum and mouth corners, the nostrils, the nasolabial and mentolabial folds, the Frankfurt plane points and a skull midline curve that stays on the cranium (it does not reach the face's skin). The body observation (`body-observations.json`) carries the measurement courses as native contours (Underbust, Hip, Waist, Rise, Neck Base and the rest, with Bust Span's two ends at the apexes) and the bind skeleton, every joint's affine in editor centimetres, from the spine and limbs to each phalanx and toe joint.

## Viewer features

One service at `http://127.0.0.1:5173`. Passes `surface`, `overlay`, `construction`; cameras `whole-*`, `region-row*-*`, `head-*`, `eye-*-front`, `free`; free view `az`, `el`, `view`, `target`, `dist`, `ortho`; `curves` selection with `isolate` and `fit=selection`; `garment=0`, `hair=0`, `material=clay`, `light=raking-left|right`; 2D curve diagrams with curvature combs and station series (`<chain>@<from>:<to>:<step>`), axis profiles; receipts, SHA headers and the archive; the stickman page. The audit set is f1's bare whole front, side, top and back plus construction front, side and back every 15 minutes.

## Open defects and their causes

Seen in `packages/playground/.shots/campaign-r15` (all four people, master) and earlier rounds.

| Defect | Issue | Cause |
| --- | --- | --- |
| Ledge from each lateral canthus to the temple, line at eye height | #2978, #2979 | Head rows missing 1586.5 to 1597.5 mm; one section per height crossing the eye; sections fold at the canthus |
| Lateral canthus open past the globe, lid teeth | #2979 | Aperture cut by position from a bridged loft; short margin columns |
| Auricle stairs, ripples, helix-root trace, rim and lobe joins | #2984 | Auricle inside the middle head's sections; rim, pocket and lobe chains 0.1 mm apart; branch rings across the helix |
| Lip notch at each commissure, light patch at the left one | #2980 | Tilted lower head rows ringing at the lips; oral line crossing layers |
| Rough nostril rims | #2983 | Cut edge of a bridged loft; inferred pocket meeting it without matching derivatives |
| Line under the chin | — | Tilted lower head rows advancing unevenly |
| Vertical striations on the forehead and the backs of the thighs | — | Phase noise of 256-point sections fitted to faceted rows |
| Abdominal band, horizontal gluteal fold, armpit lump, thigh line at the crotch ring | #2985 | Trunk and leg rows; horizontal contact rings at the crotch and axillae |
| Bob fringe saw edge, back highlight strip, standing strands | #2987 | Hair card rules |
| Shape-law residuals (neck length, m2's mandibular width) | — | Landmarks the face stretch itself moves |
| Grey blotches over the back and top of the hair, hair flaring at the back (render audits AUDIT27 to AUDIT32, from `77b40b5b6a`) | #2987 | Not yet traced; the envelope's hanging-column data rises as `1 / cos` toward 75 degrees below the horizon, where a sum of Gaussians can oscillate and turn the shading normals; the inspection round traces it |

Appearance goal stated by the user: women's skin reads milky.

## Root causes

1. Rows of a triangulated source are stored as shape, so its facet noise is the skin's shape.
2. One world-height section per level carries every feature at that height, so protruding parts fold the sections, need branch events, and cannot be transformed on their own.
3. Contacts are horizontal rings, so folds that curve (gluteal, inframammary) cannot follow anatomy.
4. Repairs act after the fit and cannot separate shape from noise.
5. The basis and the law are tied to the layer structure and the chain names, so any representation change must carry them.

## Local experiment, not committed

Head chains stored as key sections with natural cubic spline interiors, fitted to all head rows by surface-distance minimisation with a thin-plate energy (`fitFeatureChain.ts`, `AutoMovieHumanFeatureChain`): the forehead and temple striations, the under-eye wrinkles and the auricle's middle-head stairs disappear; the canthus ledge becomes a soft groove; the middle head stalls at 0.20 mm RMS because the auricle's folds cannot be fair sections of the head; the crown needs a cap rather than horizontal sections. It confirms causes 1 and 2 and is a component of the plan, not the plan.
