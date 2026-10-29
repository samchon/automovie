# Human survey

The current [campaign plan](campaign-2999-plan.md) preserves the restored normal baseline and separates person/row corrections in its actual parameter path. Its goal is to construct and expand lofting-curve layers from major anatomical centres, part-local frames, reference directions and dimensions by reusable algorithms, retaining the existing skin-joining extension algorithm. Coordinate differences from Recovery or the pre-PR baseline are diagnostics; smoother curves are allowed when construction remains finite, connected and anatomically sound, with stable consumers across the supported parameter domain.

Earlier observations below remain evidence of their stated snapshots; their prototype inventories, source-admission proposals and sparse reconstruction dispositions are withdrawn as implementation instructions. They do not gate restoration or select a new mathematical family. Immediately stop and reselect a disproven strategy instead of extending it with local patches, recording the learned causes and applicability in the existing documents for reuse.

## Rejected sparse reconstruction

Root inspected the latest 49 resident PNGs and seven diagram PNGs and matched all 63 files, including the seven diagram SVGs. The 49 header receipts and 135 source checks had no mismatch. The resident model was `88c9d293e0535df5b635791929df0ec45f782fd5a670b2a51e9d93c49fe5a962`. This is distinct from the earlier 198-PNG/13-diagram round below.

| Phenomenon | Root cause and contributing factors | Disposition |
| --- | --- | --- |
| The assembled head, trunk and limbs lost normal anatomy despite shared boundaries and numerical construction being present. | Required shape information was misclassified as overfitting and deleted; a predetermined sparse polynomial/primitive family then constrained the attempted repair. Parameter values and connection residuals could agree without preserving anatomical shape. | Reject the result and cancel further tuning of that reconstruction. Restore the coherent working figure, retain its shared connections and parameter meanings, then distinguish universal construction from person/row corrections in the actual generating path. |

Evidence: [capture index](../../playground/.shots/campaign-2999-codex-ordinary-mid-first/capture-index.json), SHA256 `23E2AB810F364530E2590F1478FEDBBBE5D62EF5ED0E4C323F0D10A8AEB71D11`; [round summary](../../../.shots/campaign-2999-codex/ordinary-mid-first-round-summary.json), SHA256 `9BE7F22C4AD71558836E5A432ED00A33A6DDA1566F7DB3D06297F980513C3660`. No anatomical acceptance follows from the verified capture transport.

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
- Size: about 4.9 MB of TypeScript literals (torso 2.4 MB, head 1.1 MB, basis 0.8 MB, foot 0.5 MB). CI's `packages/human` build spends 22 of 24 minutes type-checking and linting them three times.
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

### Restored input-path findings

The original f1 POST, surface PNG and curve PNG/SVG succeeded with 1,973 parts, model `1faf6d7c9e7c16cf6116528a7ec132937107856e554b8894e0745b539f77b38a` and construction `86d4679f2d5b7421b8ee5efbe6478eb898e862cbdf0da4b740287f1b45cb8899`. Root checked all three artifacts' hashes/headers and opened both PNGs; the [transport receipt](../../playground/.shots/campaign-2999-codex-input-observation/transport-smoke/transport-results.json) records those results.

All twelve independent single-scalar POSTs returned HTTP 500 with the same 432-byte error, SHA256 `258CF242C15B9A773A9C3D50D31882CC97E350040AA419FDBCF0BCF4F7E8451E`, and produced no PNG. Root independently checked the actual request/response files, statuses, bodies and hashes. The [admission summary](../../playground/.shots/campaign-2999-codex-input-observation/custom-post-admission-round/summary.json) records the round; these requests failed before geometry could be observed.

| Finding | Cause and contributing factors | Consequence and correction boundary |
| --- | --- | --- |
| Registered f1 works while every changed request fails. | `admitHumanParameters` accepts only exact registered-example JSON, and actual consumed parameters were not verified. | Example success does not establish runtime admission or parameter response; the failure is admission evidence, not malformed geometry. |
| A failed replacement cannot establish preservation of the current live figure. | The page retires its current model before the replacement's admission fails. | Only the saved baseline artifacts remain evidence; separate validation/failure handling from retiring usable geometry. |
| Restored generator and viewer dependencies disagree. | Static review found retired sparse adapter/API references, active calibrations excluded from cache identity, a mandatory heap environment breaking ordinary development startup, and missing actual-parameter verification. | Align source/cache identity, adapters and defaults with the actual restored working path. These findings are under one cause-based repair batch; completion and successful changed-input rendering remain unverified. |

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

## Campaign 2999 inspection, 2026-10-27

This is the static survey for #2999, with #2997 required before #2998. All six part owners and Integration supplied their surveys. Earlier source-atlas/CV/admission proposals were withdrawn after the user's formula-priority steering; their source facts remain diagnostic evidence. No new fit or visual acceptance exists. The existing sections above describe the inherited baseline; their numerical claims have not been rerun in this campaign. The current checkout is `D:/github/samchon/automovie@human`. No external path recorded inside a reference manifest is an input to this campaign.

### Independently available inputs

The direct-path inventory is `.shots/campaign-2999-codex/method-survey-evidence.txt`. `test/.shots/{f1,f2,m1,m2}/` each contains its own `hermite-curves.json.gz`, `captures.json`, `body-observations.json`, `head-observations.json`, `body-native.json` and `head-native.json`; these directories have no filesystem link target. Only f1 has `body-sections` in this checkout. Its saved families include the trunk horizontal rows, bilateral arm and leg families, joint planes, roots, and bilateral digit and toe families. These observations permit the first part surveys without reading another checkout.

The issue's measured identities point to a directory prohibited by the user's isolation instruction. Those files have not been read and are not campaign inputs. `measureIdentity.ts` accepts a person directory and an output filename and reads the local native body, native head, body observations and head observations. All of these source filenames exist for every alias here. The complete static measurement review below identifies protocol corrections and unavailable landmarks; regeneration still requires those qualifications and Integration's computational slot. No identity has been regenerated or accepted yet.

### Shared fitting defects traced in source

| Phenomenon | Cause in the current checkout | Required correction |
| --- | --- | --- |
| Existing fitters cannot be executed within the user's isolation rule | `fitTrunkBase.ts`, `fitBodyBase.ts`, `fitAppendage.ts` and `exportModules.ts` hard-code another agent's scratch directory | Give every command explicit task-owned input and output paths before execution |
| Reported residuals can omit unsupported regions | `HumanModuleFitting.Model.pair` skips unpaired samples and zero-weight residuals, and returns only inliers | Report every observation/projection failure as diagnostics; do not use source error to select or expand the fixed formula |
| A named standard method still carries unsupported shape choices | `HumanModuleFitting` fixes the GCV bracket, tangential weight, station sampling, basis truncation and matrix bandwidth; part entry points add their own cutoff, order, pairing cap and mask dimensions | Trace which dependencies encode anatomy and which encode fitted corrections; replace unsupported choices while preserving normal shape and parameter meanings |
| Solved equations are approximated without an error report | `Normal.row` discards station couplings beyond its bandwidth and `Model.pair` discards small cardinal weights although a natural cubic cardinal basis has global support | Keep the generated operator and its diagnostics consistent, preserving couplings and reporting numerical approximation rather than imposing another formula family |
| Smoothing selection validates a changing inlier population | `crossValidated` uses weighted fitted-surface inliers, an estimated influence trace and a fixed search interval | Retire automatic smoothing/model-order selection; keep the diagnostic observation population/failure counts fixed |
| Exported modules cannot simply replace the baseline | `AutoMovieHumanBodyRegions.merge` expands networks separately, while the fitter can use `FeatureChain.compose`; `AutoMovieHumanBodyCalibration` still imports world-height calibrations and repair rules | Preserve the coherent baseline and its shared-key consumers; separate each fitted correction from the reusable composition before replacing that dependency |
| A measurement law remains tied to retired representation | `AutoMovieHumanBodyLaw` applies a specimen-indexed displacement basis and layer-based warp before event repair | After #2997 acceptance, replace this path with one identity-based module law and inspect every measurement consumer |

Method read all six owners' compact surveys and complete Trunk/Head/Foot admission plans. Those records expose remaining qualification gates, rather than establishing anatomical decomposition or a successful fit. No new renders have been requested during this static phase.

### Measurement algorithm review

Method read all of `measureIdentity.ts`, the body, arm, leg, posture, head, eye, nose, mouth and ear identity declarations, and the local observation metadata. `.shots/campaign-2999-codex/method-measurement-review.txt` retains the assignment and heuristic line numbers. No measurement run has occurred. The script's output is a partial object, not a validated `IAutoMovieHumanIdentity`.

The source definitions are the [2011 Army/Marine Corps measurer's handbook](https://archive.org/details/DTIC_ADA548497), [1988 Army measurer's handbook](https://archive.org/details/DTIC_ADA202721), [1988 Army results report](https://archive.org/details/DTIC_ADA225094), [FaceBase's original landmark protocol](https://www.facebase.org/resources/human/facial_norms/notes/), [CDC's original anthropometry manual](https://wwwn.cdc.gov/nchs/data/nhanes/public/2007/manuals/manual_an.pdf), and [Cho et al.'s original ear study](https://jkms.org/DOIx.php?id=10.3346/jkms.2025.40.e107). Initial direct ANSUR URLs failed; Hand subsequently obtained the original DTIC report bytes through Internet Archive, extracted text and opened the relevant pages. Method read that source-review receipt. The archive supplies the primary documents, not a replacement protocol. These sources define measurements, not an automatic landmark detector.

| Emitted quantity and code line | Existing algorithm and available local observation | Regeneration or qualification required |
| --- | --- | --- |
| Stature, 895 | Native skin maximum minus minimum Y | Record standing datum, posture and treatment of non-skin geometry; extrema can be computed without a shape constant |
| Cervicale and suprasternale heights, 432-433, 896-897 | Back/front extrema of the oblique Neck Base course | These course extrema are not certified C7 and jugular-notch landmarks; acquire named landmarks or mark unavailable |
| Acromial height and biacromial breadth, 438-447, 898-899 | Coronal contour corner selected near the shoulder joint with an arbitrary search radius | Acromion is a surface/bony landmark, not the joint centre or an unspecified corner; independent named landmark acquisition is required |
| Span, 468-477, 900 | Sum of shoulder offsets and skeletal chord lengths, ending at a mesh fingertip | Does not reproduce the stated outstretched-wall protocol; obtain that pose or keep a separately named mechanical span |
| Bicristal breadth, 901 | Full skin breadth at High Hip course height | Compressed iliac-crest breadth is not the skin outline; named crests and protocol evidence are absent |
| Hip-joint-centre breadth, 902 | Euclidean joint-centre distance | Public definition is horizontal breadth; use its horizontal component in the registered rest frame and retain left/right joint provenance |
| Hip breadth, 503-521, 903 | Maximum lateral skin extent over a searched pelvis height interval | Confirm complete buttock coverage and standing protocol; do not certify the bounded search as the published site without evidence |
| Neck circumference, 904 | Bone-normal cut through the foremost Neck course point | Qualify that point as the infrathyroid site and retain the axis/site; source named course alone does not prove it |
| Chest circumference, breadth and depth, 905-907 | Horizontal cut at mean Bust Span endpoint height | Preserve the source course definition; breadth's compressed/inspiratory protocol differs from an unloaded scan; no correction factor may equate them |
| Underbust circumference, 908 | Horizontal cut at mean Underbust course height | Use the actual recorded inframammary site and report any nonhorizontal course or absent fold |
| Waist circumference, height, breadth and depth, 482-490, 909-912 | Narrowest lateral outline between High Hip and Underbust | Greatest lateral indentation may qualify a natural waist, but the specified fallback requires tenth-rib and iliocristale landmarks; these are absent |
| Buttock circumference and depth, 495-502, 913-914 | Most posterior trunk section between Rise and computed waist | Qualify the right buttock landmark and standing datum; a global posterior maximum is not automatically the stated right-side site |
| Craniovertebral angle, 916 | Angle to mean ear_tragus feature from inferred cervicale | Ear-tragus curve centroid and inferred Neck Base extremum are not certified tragus/C7 landmarks; retain as a geometric surrogate until endpoints are acquired |
| Forearm length, 564 | Elbow-to-hand joint-centre chord | Radiale and stylion are absent; joint-centre length must not be emitted under that public landmark definition |
| Hand length, 565 | Hand joint centre to inferred middle-finger tip | Stylion is absent; retain the exact distal extremum but acquire that specified proximal landmark |
| Hand breadth, 566-570 | Extent of the metacarpal-head cut in its across direction | Keep the named heads plane and qualify the published breadth direction and skin contour |
| Palm and thumb lengths, 571-572 | Joint-centre chords to middle_01 and thumb_02 | Palmar creases are not stored as named observations; acquire crease endpoints instead of substituting joint centres |
| Upper-arm circumference, 547-548, 573 | Cut midway between inferred acromion and elbow joint centre | CDC locates the midpoint with acromion and olecranon; olecranon is absent, so acquire both surface endpoints |
| Forearm circumference, 574 | Maximum bone-normal girth below elbow | Qualify the relaxed posture and published plane; preserve this as a geometric scan measure until that is established |
| Wrist circumference, 575 | Cut through hand joint with averaged adjacent-bone direction | Styloid site is absent; acquire the landmark rather than shifting the joint plane by a fitted offset |
| Thigh and shank lengths, ankle height, 660-662 | Vertical differences of hip, knee and ankle joint centres | Public endpoints are trochanterion, tibiale and lateral malleolus; none is established by these joint centres |
| Foot length, 663 | Horizontal foot-axis extent of selected below-ankle vertices | Qualify heel/longest-toe coverage; replace arbitrary height/nearest-axis admission with the part's observed skin domain |
| Foot breadth, 664-668 | Extent of metatarsal-head cut | Preserve plane and both metatarsal-head datums; verify maximum breadth under the stated protocol |
| Thigh circumference, 669 | Bone-normal cut through saved root contour's lowest point | Root topology is not a gluteal-furrow landmark; acquire that site independently |
| Calf and ankle circumferences, 614-640, 670-671 | Bone-normal scans with an unsupported local two-millimetre narrowing rule | Public definitions require horizontal extrema; use complete admitted horizontal sections without the narrowing heuristic |
| Head length and cephalic index, 757-760, 780, 922-923 | Inferred glabella/opisthocranion and width above ear-top | These are not independently supplied cranial landmarks; certify their locations and complete vault domain or report unavailable |
| Head circumference, 815-817, 924 | Tape hull through inferred glabella/opisthocranion plane | Qualify the maximum brow/vault course rather than treating the selected plane as its definition |
| Head height, 746, 819-824, 925 | Menton from corner/offset rule, projected along saved Frankfurt normal | Frankfurt observations exist; menton does not, and its arbitrary offset construction must be removed |
| Face height, 741-743, 753-756, 926 | Profile minimum called nasion and a forty-five-degree turn called gnathion | FaceBase distinguishes nasion from the deepest nasofrontal point and uses landmark localization; acquire endpoints under that protocol |
| Face width and minimum frontal width, 781, 787-812, 927-928 | Bounded horizontal maximum and corner/narrowing heuristic | These caliper landmarks are not stored; shape extrema alone do not certify them |
| Fissure length and intercanthal width, 826-841, 931 | Euclidean distances between named inner/outer eye-corner points | Existing named features permit direct regeneration once their correspondence and frame are verified |
| Fissure height, 826-841 | Maximum upper/lower separation | Public definition is at the pupil; acquire pupil position and evaluate the actual lid intersections there |
| Nose width, height and protrusion, 845-870, 933-935 | Inferred alaria, nasion, subnasale and profile tip | No named alare/nasion/subnasale observations exist; acquire them under the primary landmark protocol; a nasal fold corner is not a certified substitute |
| Mouth width, 938 | Euclidean distance between named mouth corners | Existing corner observations permit direct regeneration after landmark/frame qualification |
| Vermilion heights, 761-764, 939-940 | Named labiale points but stomion averaged from two inferred profile turns | Qualify the resting labial-fissure point; average turns are not its published definition |
| Ear length, 872-889 | Highest helix to lowest point among stored ear curves | Qualify complete helix/lobule coverage and Frankfort orientation; endpoints remain data extrema, not guessed extensions |
| Ear breadth, 876-880, 888 | Extent of all ear landmarks perpendicular to its long axis | Cho's breadth uses the helix attachment and posterior helix; acquire the attachment rather than using a whole-feature extent |
| Ear protrusion, 881-889 | Maximum rim/scalp lateral difference in an arbitrary tragus-height band | Acquire the tragus-level rim and scalp correspondence directly; remove the unsupported band and unrelated maxima |

The script omits sitting height, bideltoid breadth, thyroid angle, upper-arm length, carrying angle, mobility fields, dorsal hand fat, navicular height, lower-thigh circumference, the radiographic posture fields other than its surrogate craniovertebral angle, mandibular width, mouth opening and laterotrusion. It also emits no body composition or pigmentation identity. These omissions must remain explicit; a neutral skin mesh cannot establish mobility, sitting posture, radiographic anatomy, pressure or composition by adding constants. #2997 can use bone joints and named course geometry as fitting datums with their actual geometric names. #2998 may consume a public measurement only after its endpoint, plane, posture and provenance are qualified and its error is evaluated under that same definition.

The durable primary locators below qualify the table's statements. A locator does not establish that the specimen was measured in that posture or possesses the named landmark. Printed pages are authoritative; the 2011 PDF physical-page offset is +10 and the 1988 handbook offset is +11 in the acquired copies.

| Public quantity | Primary definition locator and remaining observation requirement |
| --- | --- |
| Standing posture, stature and span | 2011 §§6.1,6.4.76,6.4.75 pp73,152,151: erect/Frankfurt/respiration and field-specific arm posture. Existing bind geometry alone cannot establish the wall-span protocol |
| Biacromial and bideltoid breadth | 2011 §§6.4.9/.12 pp85/88 and acromion landmark §5.2.1 p23. Acromion is palpated; bideltoid is maximum skin breadth, not the drawn deltoid marks |
| Chest circumference, breadth and depth | 2011 §§6.4.25/.24/.26 pp101/100/102. Fullest-breast tape, inspiratory compressed rib-cage breadth and unloaded depth are different protocols; the single Bust Span plane cannot certify all three |
| Natural waist | 1988 landmark p60, measurement p182; results variable113 p298. Right greatest indentation, or midpoint of tenth rib/iliocristale when ambiguous, transferred horizontally. 2011 §6.4.88 p164 instead uses omphalion; it must not replace natural waist |
| Hip/buttock breadth and circumference | 2011 §§6.4.51/.17 pp127/93: lateral buttock landmarks versus horizontal tape at maximum right-buttock protrusion. Complete skin extrema are useful evidence but posture/site still require qualification |
| Neck circumference/base | 2011 §§6.4.63/.64 pp139/140: infrathyroid neck-normal course versus specified anterior/lateral base landmarks. An oblique source Neck Base contour is neither certified endpoint set |
| Upper-arm and forearm length | 2011 §§6.4.3/.68 pp79/144; radiale §5.2.33 p55, stylion §5.2.36 p60. Required acromion/radiale/stylion are not skeleton joint centres |
| Hand breadth/length/palm | 2011 §§6.4.43/.45/.66 pp119/121/142, metacarpaleII/V §§5.2.24/.25 pp46/47. Palpated skin landmarks and proximal digitIII crease/ventral stylion, supported specified postures; local heads cuts and joint chords do not supply them |
| Wrist circumference | 2011 §6.4.93 p169 and stylion p60: stylion level, plane perpendicular to forearm with elbow90/palm up. The extractor's averaged forearm/palm direction is not this plane |
| Relaxed upper-arm and forearm girths | CDC upper-arm midpoint protocol uses acromion/olecranon. 2011 §§6.4.10/.39 pp86/115 are flexed muscle/forearm measurements; they cannot certify the public relaxed midpoint/maximum fields. A matching relaxed protocol and landmarks remain required |
| Foot length/breadth | 2011 §§6.4.36/.37 pp112/113: foot breadth/length, loaded Brannock-axis protocol and heel-to-longest-toe extent. Saved rest skin requires explicit posture/landmark qualification |
| Thigh/calf/ankle circumference and crotch height | 2011 §§6.4.79/.22/.5/.28 pp155/98/81/104. Thigh's gluteal-furrow-level axis-normal tape differs from a root ring; calf/ankle are horizontal extrema; crotch requires contact protocol |
| Clinical lower-limb lengths, skeletal breadth and heights | Check each current public type's stated endpoints against independent acquired bony/skin landmarks. This survey has no primary verification that trochanterion/tibiale/malleolus equal the saved joints; it makes no such substitution |
| Cranial/facial/eye/nose/mouth fields | FaceBase protocol and the public Farkas field descriptions supply named endpoints and caliper/3D distinctions. Existing inner/outer canthi and mouth corners are potential direct observations; inferred nasion, menton, gonion and crease turns remain unqualified |
| Ear fields | Cho's methods identify helix/lobule, helix attachment and tragus-level protrusion. Existing landmark curves need complete coverage and those exact correspondences; a whole-ear box or arbitrary tragus band is insufficient |
| Thumb, mobility, radiographic posture, composition and pigmentation | No matching thumb-length primary protocol was verified in the acquired reports. The other listed fields lack independent source evidence here; report unavailable rather than infer them from neutral skin |

Primary document provenance is reproducible with `Invoke-WebRequest` to each item's exact `.../download/<accession>/<accession>.pdf`, `pdftotext -layout`, `pdfinfo`, `Get-FileHash -Algorithm SHA256`, and `pdftoppm -f <physical-page> -l <same> -png -singlefile`. The printed 2011 PDF is 5,224,258 bytes/263 pages, SHA256 `D31D6333BBE5CC2A09AA2519C4AF4C230735DE4CAAC68FD2148DAD3D00DFD42C`; 1988 handbook is 54,413,149 bytes/333 pages, SHA256 `43D53EFAA0308E33D982459CBACB07EB893131E3B81565B45CA357DAEEA708B8`; results report is 25,511,847 bytes/649 pages, SHA256 `EB951D571A55D2DCEE1802BDC642D3C95B5B57562908D5D4AFBA762DF9157150`. These printed file facts came from Hand's source receipt; no new body measurement was computed. Downloaded reports/text/pages remain task evidence and are not committed.

### Part-owner survey handoffs

Method read `trunk-survey-compact.txt`, `hand-survey-plan.txt`, `arm-survey-plan.txt`, `leg-survey-summary.txt`, `foot-survey-summary.txt`, `head-survey-summary.txt`, Integration's full handoff and the subsequent Trunk/Head/Foot admission plans, all under `.shots/campaign-2999-codex/`. Their original command output remains in the corresponding evidence files. The following is their causal survey, not a fitted or rendered acceptance claim.

| Part | Available geometry and qualification | Causes that the whole plan must remove |
| --- | --- | --- |
| Trunk | Saved trunk family is partial, with empty rows and unresolved acquisition errors; original Hermite neck region has multiple loops. Neck Base is oblique. | Legacy calibration initializes the base; forbidden head scratch fit selects its neck, reversing ownership; fixed relief margins and hidden masks obscure base/relief identifiability; cap pole and trim fallback lack full coverage; shared-key map handles signs without general scale |
| Hand | Palm observations are the wrist-to-heads part of each arm family plus oblique heads observations; bilateral digits preserve independent roots and terminal coverage. Saved local planes support direct coordinates, but do not establish inter-section phase correspondence. | Arbitrary model/sampling constants, unsupported palm pole and digit cap, failed or inward residual omissions, root projection fallback, wrist/strip derivative drift and identity/skin-crease mismatch |
| Foot | Foot observations are the ankle-to-heads part of each leg family plus toe families and oblique heads; terminal empty planes record coverage limits. | Some saved toe roots have broad contours that may include adjacent forefoot; parent-axis winding alone does not identify one toe. Root ambiguity, sine caps, saturated residuals, discrete trim carrying and repaired monolithic phase correspondence must be replaced together |
| Head | Original Hermite stream inventory is complete; named eyelid families retain open paths despite zero closed loops. Native semantic disks, source-cut words and ordered feature curves are local; current ear skin atlas explicitly has zero completed charts. | Old calibration/reflection, erased open paths, unqualified bridges/height graphs, missing return roles, cap/auricle atlas and copied neck authority must be replaced together |
| Arm | Main/joint families duplicate physical planes; stations are nonuniform and stored source derivatives jump. Hand owns wrist full jets; root ownership needs source incidence. | Fixed sampling/complexity, independent endpoint slopes, local-plane winding mistaken for parent trim winding, missing projection failures and incomplete G2/mixed jets |
| Leg | Both families have248 retained sections; source spacing is nonuniform. Root24 is a split candidate, not established thigh ownership; Foot owns ankle jets. | Hardcoded station/order/reach, ambiguous own/neighbor root, omitted failures, independent ankle reconstruction and nearest trim/strip behavior |
| Integration | Local inputs and typed image registry are independent; installation completed with task TEMP/TMP. Existing calibration/repair/appearance/rigging/viewer paths all still consume the old shape authority. | Forbidden exporter root, quantization, reconstructed slopes, dome/normal/event repairs, stale dependency diagrams and unmigrated accessory/rigging consumers must change as one closure |

Toe-root ambiguity requires named source ports and complete component continuation, not robust exclusion of awkward observations. The earlier source-cap/CV/query/gauge reconstruction design is withdrawn. The active plan preserves the working construction and treats its joins as reusable; source topology remains diagnostic evidence rather than a new source-admission prerequisite. The Trunk owner also identified the normal-relief derivative-order issue: a merely C2 base does not provide a C2 normal field. Any use of a normal field must supply the derivative order its actual consumer needs. No owner has supplied a generated boundary or successful fit.

### Historical source-admission inspection and reproducible findings

Method read all six final part admission plans plus Integration's agreed final contract, public-export transcript and external-old-import census. Those source procedures were unexecuted reconstruction proposals, not the active generator design. The current preservation and correction boundary is in [campaign-2999-plan.md](campaign-2999-plan.md). No acquisition or fit success follows from the old proposals. That historical design separated raw wrist/ankle ports from fitted full jets and attempted source-qualified replacement of roots17/24. Its cross-source incidence claims required explicit original native/body+head/weld maps. That proposal is withdrawn; ordinary generation retains the working owner boundaries, and a missing source qualification does not erase available anatomy.

The following bounded printed summaries survive scratch cleanup. Each comes from the indicated owner's complete PowerShell inventory/admission output, not a new Method calculation. Commands decode one explicit local family with .NET gzip/Newtonsoft as appropriate, then print schema/count/scalar/hash fields; raw arrays are not logs or committed source.

| Input population / inspection command scope | Printed source facts and limitation |
| --- | --- |
| `Get-Item`/`Get-FileHash` on explicit `test/.shots/{f1,f2,m1,m2}` members; f1 `body-sections` enumeration | All four local directories have native/observation/Hermite/capture inputs and no link target. f1 has112 body-section files; the other three have no body-sections directory. No forbidden measured identity was read |
| Trunk JSON family schema, section/loop/report aggregates |333 rows,327 one-loop and6 empty;443 unresolved-tolerance diagnostics. Neck source313 is y1431.1013946533203mm, with neighbors312/314 and source derivative gaps; it is a rig-based datum, not a measured neck endpoint |
| Head streaming Hermite range probe with full-array completion | y>=1400 inspection range completed:2597 rows,16 empty,2552 multiloop,12993 closed loops,187367 spans; saved units mm:mm. These are inspection-range counts, not an anatomical cutoff or a fitted head |
| Head source-network/feature/ear metadata keys | Native skin48004 faces; common exterior37420;46 ordered curves,45 complete. Ear atlas32 courses/115 intervals/90 hits,82 phase candidates and8 no-hit courses, zero completed skin charts. Source IDs/topology are incidence evidence, not exported shape |
| Arm corrected full family census and exact u/v grouping |151 planes per side,377 report fits,216/215 failed quality flags;59-plane fixed prefix0..58. Canonical wrist129 has retained1+others2/report3. Scalar `others.Count` and nonexistent report-field probes were explicitly invalidated |
| Hand corrected fourteen-family census and native terminal metadata |All sections have zero report-count mismatch after reading integer `others` correctly. Index/middle/ring single-tip records true; thumb/pinky false with three regular events, palm false with eleven; all capAuthorized false. V2 digit families have10..15 orientations, so one fixed-axis slab family would be false |
| Foot full-family metadata and named port inventory |Full foot file9,244,264 compressed/31,199,128 decoded bytes; five qualified distal leaves per side. Each toe_02 has one retained port with additional neighbor loops; ankle209 is exact bind-plane match. Named path/root/ankle source incidence is still missing execution evidence |
| Leg corrected full census and exact u/v grouping |248 retained/298 other-count curves and546 reports per side;161 retained failed quality flags,56 exact frame groups; root-axis group0..95. Old saved sourceLineage count0. Rows22/23 have others0 and24/25/26 others1; this alone does not prove the crotch split |

Reproduce static source/compile closure with `rg --files test/src/executable/reference-experiments/human-calibration`, `rg -n 'from .*AutoMovieHuman' <explicit calibration directory> --glob '*.ts'`, and `Get-Content` on both calibration configs. The complete calibration config has no include/exclude; the observer config explicitly names observeBodySections.ts. The ignored executable root must be passed explicitly: a broad parent test/src scan misses old fitter imports. Source-only observers/planners and geometry utilities have no direct old generated-calibration authority; their actual dependencies remain available while obsolete fitters are retired. No compiler was run in this survey.

Integration's public boundary inspection used `Get-Content packages/engine/package.json | ConvertFrom-Json` and bounded `rg -n` on `packages/engine/src/index.ts` and geometry barrels. It printed existing public math QR/SVD/adjacent-float exports, curve Bernstein exports, root canonical-json/SHA and triangulateAutoMovieRegion. No new engine export or dependency is needed. Ordinary Bernstein subdivision/product results are rounded values; widening only their final result cannot certify all accumulated rounding. The earlier generic certified-query proposal is withdrawn. New fixed-formula numerical queries report candidates, failures and unresolved work without claiming a global interval certificate.

The cap source is [Myles and Peters2011](https://www.cise.ufl.edu/research/SurfLab/papers/09bi6c2polar.pdf), DOI10.1016/j.cad.2011.08.018, printed equations(4)/(6), theorem1. Foot's PDF inspection printed1,592,839 bytes, SHA256 `67F58273823C2B4BADA4D6E759824637A125FA1C35F0E173DF18D200DFAAF9FB`; Method opened pages4/5. Its uniform-periodic precursor, degree-(3,6) product, Cartesian quadratic pole expansion and compatible four outer rings are the scope of the citation. That historical compatibility study does not select this cap for the new model; no cap family is selected by the current preservation plan. Neither source fidelity nor global embedding follows from the citation. Downloaded source/text/pages remain uncommitted.

Integration installation printed Node24.18.0 and INSTALL_EXIT_CODE=0. The documented minimum22.23.2 is not the observed version. Initial1/1.5GiB process policies were not user limits or demonstrated failures. Main later approved a single heavy lease with heap2048MiB, observed per-process3GiB and owned aggregate6GiB, requiring fresh available/commit and exact design-memory preflight. Survey workers remain within1GiB. No new fit/build/acquisition/server/render used that future lease in this phase.

### Other open work

The initial historical read-only inventory recorded #2971 (mouth geometry and expressions), #2967 (Recovery reconstruction), #2964 and #2955 (appearance and resources), #2963, #2961, #2956, #2954, #2952, #2950, #2949, #2948 and #2947 (articulation and runtime work), and #2946 (appearance campaign). Their requirements do not establish defects in this campaign's fitted neutral skin. Owners must identify concrete interactions rather than silently widen #2999 into those campaigns. The inherited defect rows above include closed or historical issues; they remain inspection targets until current generated output has been observed.

## Withdrawn formula replacement

The fixed prototype counts, prescribed polynomial/primitive formulas and source/proof gates from the replacement experiments are not current requirements. Their mathematical validity did not establish adequate anatomy. The retained [construction lessons](campaign-2999-lessons.md) apply inside the restored working path without requiring completion of those experiments.

## Working-baseline inspection, 2026-10-29

This recorded baseline round supplies the preservation comparison in the current [campaign plan](campaign-2999-plan.md). Root and Method opened all 135 baseline PNGs: 24 whole-figure, 67 selected close-ups and 44 plain close-ups, from one unchanged model in `packages/playground/.shots/campaign-2999-codex-baseline-f1-restored/`. Method matched all 44 plain PNG hashes to their saved response headers. Root also operated the actual viewer controls. The finite capture round is closed; source changes and replacement acceptance remain pending.

| Phenomenon | Source cause and contributing factors | Related PNGs in that directory |
| --- | --- | --- |
| Complete human silhouette, connected neck/limbs, five digits and usable skin survive. | The working chain/event/contact/strip/cap and ordinary appearance/export consumers provide the preservation baseline; dense specimen authority is independent of their reusable operations. | `front.png`, whole back/side/top passes, `plain-legs-*.png`, `plain-hand-*.png`, `plain-foot-*.png` |
| Ear rim points, lateral lid crease, shallow head band and neck collar remain visible under plain raking lights. | Fitted rim/tip rows and automatic cap-base selection, corner smoothing, independent event curvatures and normal-ring masking contribute; no single pixel's cause is established by shading alone. | `plain-head-*-raking-*.png`, selected head construction passes |
| Axillary, elbow and gluteal/inner-thigh bands coexist with light-dependent chest/abdominal shading. | Independent fitted sections, world-height station grammar and event repair/masking share the affected boundaries. Opposite raking lights separate illumination changes from persistent lines; trace the dependent corrections while preserving the anatomical information and reusable shared connections. | `plain-upper-*.png`, `plain-pelvis-*.png`, `plain-legs-*.png` |
| Wrist/ankle boundaries and smooth silhouettes coexist with independently inferred measurement/rig/tone sites. | Arm end is a thumb branch rather than the semantic wrist; world-XZ girths, world-Y joint sites and skin-tone directions ignore local frames. Resolve final owner stations, actual axes and physical plane metrics in all three consumers. | `plain-hand-*.png`, `plain-foot-*.png`, selected overlay/construction passes |
| Some selected close-ups conceal surface detail or look cut near neighboring anatomy. | Selection color/legend, fixed-width construction tubes, initial framing and clipping affect display. Plain close-ups restore wrist/palm and foot-surface coverage; clipped neighboring fragments alone do not establish a skin tear. | selected upper/hand/foot passes versus matching `plain-*.png` |
| New shared germs would still be overwritten without consumer changes. | FeatureChain.expand omits second/frame jets, trim reconstruction drops fields, generated bypass covers only networks, and EventJoin/ringBlend unconditionally modify fitted incidents. Preserve rich actual layers and explicitly consume the generated shared-germ path. | Source-to-consumer review tied to all affected close-ups; no replacement render is claimed |


## Baseline dependency causes

1. Rows of a triangulated source are stored as shape, so its facet noise is the skin's shape.
2. One world-height section per level carries every feature at that height, so protruding parts fold the sections, need branch events, and cannot be transformed on their own.
3. Contacts are horizontal rings, so folds that curve (gluteal, inframammary) cannot follow anatomy.
4. Repairs act after the fit and cannot separate shape from noise.
5. The basis and the law are tied to the layer structure and the chain names, so any representation change must carry them.

## Foot-only development round, 2026-10-29

All 30 PNGs in `campaign-2999-codex-baseline-foot-second/capture-index.json` were opened and checked against their recorded SHA256. They share model `b272b821e329c46fc10b5a3ae9cb49af18c0f0bbadfa0e2e59d1cde4068c5a26` and construction `f0fc61ca7649b7028b4aacbe3c90eb74460d7d09707f26d1cd2fa66262f4f5cc`; this is an intermediate Foot-only result, not visual acceptance.

| Phenomenon | Cause and contributing factors | Evidence |
| --- | --- | --- |
| Large ankle gaps, stretched triangles and direction changes | Legacy Leg does not consume the generated Foot boundary. The new negative-sine convention also opposed the existing positive-sine mesh winding and increasing inherited correspondence. These are separate from internal toe contacts. | `front.png`, feet surface/overlay/construction views |
| Forefoot/toe-root folds and thin pointed panels remain under both plain raking lights | Independent parent compound and child-root projections do not share generating spans or transverse jets; fitted EventJoin and ringBlend remain active. Existing contact shares mesh indices, not an independently proved smooth germ. | plain left/right foot views and upper oblique pair |
| Fan guides bend into a hump/heel hook | A fixed fan pivot and eccentric coefficients were interpolated separately from rotating frames. Carrying each section mean in its actual frame removes this duplicated positional freedom without tuning default values. | feet construction views |
| Small dark toe-tip facets and bands | Cap, mesh normal and nail contributions are not isolated by this round; no single-cause claim or local correction is justified. | plain left/right toe views |
| Selection colours, legend and body occlusion | Display contributions obscure some skin evidence; the plain upper-oblique pair supplements the coverage. | selected views versus plain upper-oblique pair |

The proposed follow-up to this Foot-only experiment is canceled with the sparse reconstruction. Its observations do not authorize replacing the working Foot or rebuilding the common contact/strip system.

## First all-owner ordinary round, 2026-10-29

All 198 resident PNGs and 13 law-reassessment diagram PNGs were opened. The resident model is `27117733eb2b44e8461f71de21d7284ee5cbe8419b0d8f804d2ca097dbe13d0d`, construction `9ede3619a5c5afb8ad3cbf38e3538ec5779db392f9491ba72ad71d7f713fdaae`, source `35d89cb5a0d9dfea5325487e9ce299cb44378f4d6ce272e603290dc819047bf9`. Local PNG hashes match 174/174. `campaign-2999-codex-ordinary-all-first/capture-index.json` binds the finite round; diagrams are separate law evaluations, not measurements of the resident mesh. No part receives anatomical acceptance from this result.

| Phenomenon | Root cause and contributing factors | Evidence |
| --- | --- | --- |
| Palm crossing, triangular wings, repeated digit-root folds | Positive winding changed but compound child order/physical half-cycle correspondence did not. Stationary pinches and zero-germ coefficient interpolation compound the problem; midpoint-only adaptive sampling can omit a bent symmetric quintic interval. Actual wrist composition is present and is not an extra reflected copy. | `hand-*-surface-raking-*.png`, `diagram-hand-left-branch.png`, `diagram-wrist-*.png` |
| Thumb neck and small distal drop | Small cap radius/height and its strong negative second derivative are coupled to a much longer preceding shaft with a larger radius. Cap and neighboring meridian must be authored together; cap-normal masking cannot solve this. | Hand surface/construction pairs, wrist/hand diagrams |
| Foot/toe transverse panels and crossed guides | Compound phase zero is a lateral extreme while neighboring single-loop sections start dorsally. Exact span/germ sharing at a branch does not establish consistent correspondence inside the chain. | Foot surface/construction pairs, `diagram-foot-left-branch.png` |
| Calf/ankle/heel S/Z silhouette and hook | Foot's actual end germ is shared, but unconstrained center/frame derivatives propagate through the long Leg interval. Component-wise rich-frame interpolation additionally need not preserve orthogonal unit axes. The ankle rings overlap; a missing owner boundary is no longer the explanation. | Foot side/oblique construction pairs, `diagram-lower-axes.png`, `diagram-ankle-left.png`, `diagram-ankle-right.png` |
| Abrupt shoulder double bend and long neck/upper funnel | Shoulder breadth is mixed with vertical drop; horizontal receiving plane/upward germ turns abruptly toward the inclined arm. Three sparse upper sections and component-wise rotating-frame interpolation contribute. Actual neck sections coincide despite the poor body profile. | Axilla/neck surface and construction pairs, `diagram-shoulder-*.png`, `diagram-neck-boundary.png`, `diagram-upper-axes.png` |
| Narrow chest spikes and horn-like buttock projection | A narrow central tensor kernel and single-amplitude convex-hull-girth solve concentrate missing circumference into a peak. Peak normalization does not specify a broad anatomical mass. | Whole side/oblique views, torso/pelvis raking pairs, `diagram-trunk-sections.png` |
| Tubular limbs, weak joint/mass distinction and proximal thigh bottleneck | Circular sparse defaults, centered straight courses and long interpolation remove neutral anatomical profile freedom; Trunk's pinched/aspect root changes rapidly toward Leg's circular section. Girth inputs are supplied and are not a missing-measurement gate. | Arms/knees/pelvis pairs, upper/lower axis diagrams |
| Rear head ledge, triangular submental transition and simple skull/face/ear profile | Tilted planes and horizontal landmark heights describe different surfaces; sparse posterior/support freedoms are insufficient. Independent feature margins and approximate ear chart roots do not consistently follow actual skin. | Head/neck plain raking pairs, `diagram-head-sections.png`, `diagram-neck-boundary.png` |
| Crown facets and alternating high-frequency section curvature | Large crown uses the common fixed four-step cap; uniform-angle superellipse powers have singular parameter derivatives before periodic projection. Tessellation and section parameterization are distinct from anatomical profile. | Head silhouette pairs and section curvature combs |
| Tagged unary type diagnostic and JointCentres EOF defect; otherwise generated output exists | Semantic compile identifies Vermilion's `-mouth.width`; ordinary generation and factory syntax succeed. Geometry preservation needs a typed intermediate, not severity reduction; include the collected EOF defect in the same batch. | Integration compile/build logs and source check for this fixed round |

The sparse profile/frame/cap/sampling improvement batch proposed from this round is canceled. Preserve these observations without continuing that construction. Actual course/jet/mesh/source-distance numbers not produced by the round remain unrecorded; diagram annotations do not supply them.
