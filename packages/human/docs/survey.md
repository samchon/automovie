# Human survey

The current state of `packages/human`: its generation path, calibration data, repair rules, shape law, observations, viewer and open defects with their traced causes. Update it when a fact changes.

## Generation path

`AutoMovieHuman.generate(params)`:

1. `AutoMovieHumanBodyLaw.calibrate(params)` takes the specimen calibration (`AutoMovieHumanBodyCalibration`), adds the masculine-feminine basis times the input's offset from the specimen's own value, applies the measurement law (`AutoMovieHumanBodyWarpField`, `AutoMovieHumanBodyWarp`) for girths, lengths and head and face sizes, and runs the event join again.
2. `AutoMovieHumanBodySurface.generate` lofts every chain between its stations. Each event ring is generated once by its parent and inherited by its children. Fans close the poles, apertures are clipped by position, and lids and nostril pockets are built on the cut edges. Shading normals come from the chain surfaces and blend across event rings.
3. `AutoMovieHumanBodyConstruction` builds sections, axes and guides as construction parts from the same chain functions.
4. `AutoMovieHumanSkin` builds the texture chart, albedo, relief and the `human.skin` and `human.cavity` materials.
5. `AutoMovieHumanAppearance` builds eyes, brows, lashes, scalp hair, nails and underwear from the eye apertures and globes and the head and ear skin parts.
6. Stature scales the whole result uniformly.

The specimen's own parameters return the specimen calibration unchanged at every step. Rounded poles start their domes at the first full layer (`AutoMovieHumanBodySurface`). Aperture rims average their skin gradients along the rim before the lids and pockets are built (`AutoMovieHumanSkinProjection.rim`), and `AutoMovieHumanBodyApertures.cut` drops slivers of skin left inside an opening.

A region may also carry key-section chains (`IAutoMovieHumanBodyRegion.networks`), expanded by `AutoMovieHumanFeatureChain.expand`. Reliefs (`AutoMovieHumanRelief`), root loops and trims (`AutoMovieHumanBodyRoots`) and strips (`AutoMovieHumanBodyStrip`) evaluate on them.

## Calibration data

`AutoMovieHumanBodyRegions.merge` merges four regions into one calibration: torso (23 chains: neck to legs, arms, hands, digits), foot (17 chains), head (8 chains, the head and the auricles) and eye (2 apertures, 2 globes).

- Representation: every chain is a stack of sections in world-height planes, tilted planes for the lower head and the feet. Each section is a periodic cubic B-spline of 16 to 256 control points at a principal layer, with a station slope per coefficient. The calibration has 51 chains, 25 branch events, 27 poles (fingertips, toetips, lobes, rims, pockets, crown) and 4 apertures (two nostrils, two eyes).
- One section per height carries everything at that height. The middle head's sections hold the cranium, the face and both auricles in one outline from 1543.2 to 1595.5 mm. The helices leave through one ring at 1595.5 mm, and the rims, pockets and lobes are separate chains with layers 0.1 mm apart. The nose and the lips spread over tens of the lower and middle head's layers.
- Size: about 4.9 MB of TypeScript literals (torso 2.4 MB, head 1.1 MB, basis 0.8 MB, foot 0.5 MB). The torso file is mostly the `head` chain; [Generalization](generalization.md#where-the-table-numbers-are) breaks the numbers down. CI's `packages/human` build spends 22 of 24 minutes type-checking and linting them three times.
- Fit: each layer was fitted to one row of the reference's Recovery/Hermite sections. The reference is a densely triangulated mesh, so rows 0.5 mm apart differ by up to 0.2 mm of facet noise, which the layers keep. Where a row lost the outline (1586.5 to 1597.5 mm on the head, broken by the palpebral apertures) the fitter interpolated without observations.

## Repair rules

Five rules in `AutoMovieHumanBodyCalibration` smooth the fitted rows, each within a bound, in this order:

1. section loops (`AutoMovieHumanSectionLoops`);
2. contact low-pass at the crotch, axillae, neck, head rings and webs (`AutoMovieHumanContactSmoothing`);
3. lip low-pass along the sections round the vermilion (`AutoMovieHumanLipSmoothing`);
4. corner low-pass where the oral line and the upper-lid crease end (`AutoMovieHumanCornerSmoothing`);
5. dense-layer line fit and clamped C2 station slopes (`AutoMovieHumanStationContinuity`).

The event join (`AutoMovieHumanEventJoin`) then moves every child onto its parent's ring and into its tangent plane, and the ring normal blend in `AutoMovieHumanBodySurface` reconciles independently fitted neighbours. No rule can tell a fitted corner from noise, and each exists because rows are stored.

## Shape law

- The basis (`AutoMovieHumanBodyMorphCalibration`, `IAutoMovieHumanBodyMorph`) stores a displacement per chain name and per principal layer. `fitBodyMorph.ts` reads each other specimen at the barycentric address of the calibrated f1 surface (the four reference meshes share one vertex order) and averages each layer's displacement over 1.5 mm of station, since the addresses lie up to 3 mm off the reference surface on the head. Any change of a chain's layers invalidates the basis until `fitBodyMorph.ts` runs again.
- The measurement law reads named chains (`trunk`, `upper`, `head`, `head.lower`, `head.middle`, `head.upper`, `leg.*`, `arm.*`) and landmarks on them (`AutoMovieHumanBodyGirth`, `AutoMovieHumanBodyLandmarks`, in world heights). Each target is the specimen's own measure times the input ratio, over the same measure of the body after the basis.
- Consumed head inputs: head length, cephalic index, face height and width, mandibular width, minimum frontal width.
- Unconsumed inputs, with no module to read them: nose width, height and protrusion; ear length, breadth and protrusion; mouth width and vermilion heights; palpebral fissure length and height; intercanthal width.

Each cell below is input / generated in millimetres under the same definition, both relative to the specimen in stature units. f1 is the specimen and reproduces every input.

| Input | f2 | m1 | m2 |
| --- | --- | --- | --- |
| Inseam | 736 / 729 | 783 / 784 | 792 / 793 |
| Upper arm | 327 / 341 | 368 / 378 | 372 / 381 |
| Forearm | 246 / 242 | 270 / 277 | 276 / 282 |
| Neck length (neck base to menton) | 91 / 101 | 82 / 76 | 76 / 71 |
| Across shoulder | 304 / 305 | 357 / 367 | 377 / 385 |
| Bust span | 187 / 188 | flat chest, not read | flat chest, not read |
| Face height (menton to eye level) | 114 / 112 | 107 / 111 | 111 / 115 |
| Face width | 130 / 131 | 138 / 142 | 129 / 130 |
| Mandibular width | 116 / 114 | 140 / 150 | 127 / 153 |
| Minimum frontal width | 92 / 92 | 89 / 91 | 89 / 89 |
| Head length | 182 / 182 | 168 / 173 | 181 / 185 |
| Head breadth | 144 / 144 | 151 / 152 | 146 / 149 |

Three specimens identify one basis direction, and the law makes no prediction for other inputs. f2's face shape stays f1's, and m1 and m2 differ only by their measures.

## Couplings to chain names

These name chains or their part ids and move with any change of the chain set:

- `AutoMovieHumanJointCentres` (trunk, upper, head, head.middle, the crown pole of head.upper);
- `AutoMovieHumanBodyGirth`, `AutoMovieHumanBodyLandmarks`, `AutoMovieHumanBodyWarpField`, `AutoMovieHumanBodyWarp`;
- `AutoMovieHumanGarmentBody`;
- `AutoMovieHumanSkinChart`, `AutoMovieHumanSkinLandmarks`, `AutoMovieHumanSkinMarks`, `AutoMovieHumanSkinTone`, `AutoMovieHumanFaceTone`;
- scalp hair through `IAutoMovieHumanAppearanceBody.parts` (`human.skin.head*`, `human.skin.ear.*`);
- the viewer's close-up framing in `HumanCaptureCamera.ts` (`human.skin.head/`, `human.skin.head.`, `human.skin.ear.`).

## Observations

Each of f1, f2, m1 and m2 has, under `test/.shots/<alias>/` (private, never committed):

- the reference mesh (`reference-model.json`, head and body parts, one vertex order shared by all four);
- its Recovery/Hermite section loft (`hermite-curves.json.gz`, about 50 MB): whole-body horizontal rows holding every loop at their height, 10 mm apart from 100 to 1400 mm on f1 with extra rows at topology events near the feet and the crotch, dense only over the head;
- head and body observations;
- the photographs: 140 frames of the original mesh, of the curves, and of the curves over the mesh.

f1 alone has the dense head rows of `ear-observations/`: the horizontal exterior every 0.5 mm (`horizontal-exterior-v1.json`) with its helix, lobe and lower parts (`horizontal-exterior-helix-v1.json`, `-lobe-v1.json`, `-lower-v1.json`), the closed horizontal rows (`horizontal-v1.json`), the tilted lower rows (`tilted-lower-v1.json`), and the planes normal to both outer helices every 3 mm (`rim-normal-v1.json`).

f1 also has `body-sections/`, cut from the body mesh joined to the head mesh's skin: the trunk's horizontal rows every 2 mm from the crotch to the cervicale, each limb's, palm's and foot's bone-normal planes every 4 mm, and each digit's and toe's every 2 mm. Every plane keeps only its loop round the axis, beside the joint planes they were planned from and each appendage's first key. The body mesh alone ends at the seam where the head mesh carries the neck and upper chest, so its trunk rows open above 1339.1 mm.

The head observation (`head-observations.json`) carries the source's landmarks as vertex lists in millimetres, its lateral axis mirrored against the calibration frame: the lid margins, eye folds and creases, the inner and outer eye corners, the medial and lateral brow ends and brow lines, every ear curve (outer and inner helix, central upper and lower, tragus, antitragus, concha, heel) with the lobule connection point, the upper and lower outer lip contours, philtrum and mouth corners, the nostrils, the nasolabial and mentolabial folds, the Frankfurt plane points, and a skull midline curve that stays on the cranium and does not reach the face's skin.

The body observation (`body-observations.json`) carries the measurement courses as native contours (Underbust, Hip, Waist, Rise, Neck Base and the rest, with Bust Span's ends at the apexes) and the bind skeleton, every joint's affine in editor centimetres from the spine and limbs to each phalanx and toe joint.

Fitters may read the meshes and rows; the generator never reads them.

## Viewer

One service at `http://127.0.0.1:5173` provides:

- passes `surface`, `overlay` and `construction`;
- cameras `whole-*`, `region-row*-*`, `head-*`, `eye-*-front` and `free`, with free-view `az`, `el`, `view`, `target`, `dist` and `ortho`;
- `curves` selection with `isolate` and `fit=selection`;
- `garment=0`, `hair=0`, `material=clay` and `light=raking-left|right`;
- 2D curve diagrams with curvature combs, station series (`<chain>@<from>:<to>:<step>`) and axis profiles;
- receipts, SHA headers and the archive;
- the stickman page.

The audit set is f1's bare whole front, side, top and back plus construction front, side and back.

## Open defects and their causes

| Defect | Issue | Cause |
| --- | --- | --- |
| Ledge from each lateral canthus to the temple, line at eye height | #2978, #2979 | Head rows missing from 1586.5 to 1597.5 mm, where `head.upper` runs up to 1.4 mm inside the observed skin between its layers 1596.3 and 1599.5 mm, folds at each lateral canthus and climbs back within 0.8 mm; one section per height crossing the eye |
| Lateral canthus open past the globe, lid teeth | #2979 | Aperture cut by position from a bridged loft; short margin columns |
| Auricle stairs, ripples, helix-root trace, rim and lobe joins | #2984 | Auricle inside the middle head's sections; rim, pocket and lobe chains 0.1 mm apart; branch rings across the helix |
| Lip notch at each commissure, light patch at the left one | #2980 | Tilted lower head rows ringing at the lips; oral line crossing layers |
| Rough nostril rims | #2983 | Cut edge of a bridged loft; inferred pocket meeting it without matching derivatives |
| Line under the chin | none | The tilted `head.lower` sections at 1495 to 1502 mm ring at the front (10 to 18 curvature sign changes) and advance unevenly between layers 1.5 mm apart |
| Vertical striations on the forehead and the backs of the thighs | none | Phase noise of 256-point sections fitted to faceted rows |
| Abdominal band, horizontal gluteal fold, armpit lump, thigh line at the crotch ring | #2985 | Trunk and leg rows; horizontal contact rings at the crotch and axillae; at the crotch ring the shape itself folds, its normals turning up to 9 degrees 3.6 mm into the leg |
| Bob fringe saw edge, back highlight strip, standing strands | #2987 | Hair card rules |
| Shape-law residuals (neck length, m2's mandibular width) | none | Landmarks the face stretch itself moves: the menton and the jaw-angle height shift with it |
| Grey blotches over the back and top of the hair, hair flaring at the back | #2987 | Not traced; the envelope's hanging-column data rises as `1 / cos` toward 75 degrees below the horizon, where a sum of Gaussians can oscillate and turn the shading normals |

The user's appearance goal: women's skin reads milky.

## Root causes

1. Rows of a triangulated source are stored as shape, so its facet noise is the skin's shape.
2. One world-height section per level carries every feature at that height, so protruding parts fold the sections, need branch events, and cannot be transformed on their own.
3. Contacts are horizontal rings, so folds that curve (gluteal, inframammary) cannot follow anatomy.
4. Repairs act after the fit and cannot separate shape from noise.
5. The basis and the law are tied to the layer structure and the chain names, so any representation change must carry them.
