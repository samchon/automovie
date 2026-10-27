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

A region may also carry key-section chains (`IAutoMovieHumanBodyRegion.networks`) and appendages (`IAutoMovieHumanBodyRegion.appendages`). No region under `generation/calibration/` carries either today: `"networks"` occurs 0 times in every calibration file (search). Reliefs (`AutoMovieHumanRelief`), root loops and trims (`AutoMovieHumanBodyRoots`) and strips (`AutoMovieHumanBodyStrip`) evaluate on them.

Two evaluations of a key-section chain exist, and the generator and the fitters use different ones:

- `AutoMovieHumanFeatureChain.expand` (`network/AutoMovieHumanFeatureChain.ts:23`) gives layers with cubic Hermite slopes and no plane derivatives, so planes move by the rotation Hermite of `AutoMovieHumanLoftFrame.interpolate`. `AutoMovieHumanBodyRegions.merge` uses it (`generation/AutoMovieHumanBodyRegions.ts:45`), one chain at a time.
- `AutoMovieHumanFeatureChain.compose` (`:77`) gives every layer its plane, the plane's and the coefficients' first and second station derivatives (`jets`, `:179`), so `AutoMovieHumanLoftJet.carries` holds (`lofting/AutoMovieHumanLoftJet.ts:55`) and strips, trims and shading normals read exact derivatives (`AutoMovieHumanBodyStrip.ts:174`, `:278`; `AutoMovieHumanBodySurface.ts:120`). A shared end copies its owner's key and replaces the end slope and curvature by the owner's (`:217`-`:256`), so the last interval is the quintic Hermite of the natural spline's interior derivatives and the owner's end derivatives, not the natural spline. Every step-2 fitter sets `HumanModuleFitting.composed = true` and fits on this surface.

Exported modules evaluated through `merge` would therefore render a surface other than the one fitted, without jets, so the strips would fall back to the 0.05 mm differences of `AutoMovieHumanBodyStrip.ts:181`-`:190`.

## Calibration data

`AutoMovieHumanBodyRegions.merge` merges four regions into one calibration: torso (23 chains: neck to legs, arms, hands, digits), foot (17 chains), head (11 chains: `head.lower`, `head.middle`, `head.upper` and the helix, rim, pocket and lobe chains of both auricles) and eye (2 apertures, 2 globes).

- Representation: every chain is a stack of sections in world-height planes, tilted planes for the lower head and the feet. Each section is a periodic cubic B-spline of 16 to 256 control points at a principal layer, with a station slope per coefficient. The calibration has 51 chains, 25 branch events, 27 poles (fingertips, toetips, lobes, rims, pockets, crown) and 4 apertures (two nostrils, two eyes).
- One section per height carries everything at that height. The middle head's sections hold the cranium, the face and both auricles in one outline from 1543.2 to 1595.5 mm. The helices leave through one ring at 1595.5 mm, and the rims, pockets and lobes are separate chains with layers 0.1 mm apart. The nose and the lips spread over tens of the lower and middle head's layers.
- Size: about 4.9 MB of TypeScript literals (torso 2.4 MB, head 1.1 MB, basis 0.8 MB, foot 0.5 MB). CI's `packages/human` build spends 22 of 24 minutes type-checking and linting them three times.
- Fit: each layer was fitted to one row of the reference's Recovery/Hermite sections. The reference is a densely triangulated mesh, so rows 0.5 mm apart differ by up to 0.2 mm of facet noise, which the layers keep. Where a row lost the outline (1586.5 to 1597.5 mm on the head, broken by the palpebral apertures) the fitter interpolated without observations.
- The fitters the calibration files name are gone: `fitTorsoCalibration.ts`, `emitTorsoCalibration.ts`, `fitEarCalibration.ts`, `fitFootCalibration.ts`, `HumanSectionFitting.ts` and `HumanLayerFitting.ts` are absent from `test/src/executable/reference-experiments/human-calibration/` (listed with `ls`), although its `README.md` lists them. The torso, head and foot literals cannot be regenerated.

## World-height calibration and its repair rules

The world-height calibration is the constant `AutoMovieHumanBodyCalibration` (`generation/AutoMovieHumanBodyCalibration.ts:45`-`:84`):

1. Data: `AutoMovieHumanTorsoCalibration`, `AutoMovieHumanFootCalibration`, `AutoMovieHumanEarCalibration` (the head region) and `AutoMovieHumanEyeCalibration` (`:47`-`:52`), merged by `AutoMovieHumanBodyRegions.merge` (`:53`). The first three hold the world-height and tilted-plane rows; the eye region holds only the two lid-margin apertures (Fourier series fitted to landmark curves by `fitEyeCalibration.ts`) and the two globes, no chain.
2. Repair rules applied to the merged rows (`:65`-`:76`), each with its own constants:
   1. `AutoMovieHumanSectionLoops`: radius 0.5 mm, turn 1.25 pi, spike 0.75 pi, move 2 mm, stall 0.3, span 2 mm, 8 samples per control point, 400 steps (`AutoMovieHumanSectionLoops.ts:56`-`:77`).
   2. `AutoMovieHumanContactSmoothing`: a P-spline low-pass per parent chain name with wavelength, pinch radius and reach from a table (`trunk` 50/20/15 mm, `upper` 20/20/15, `head` 15/8/10, `head.middle` 8/8/6, `arm|hand` 6/3/6, `foot|forefoot` 6/4/6; `AutoMovieHumanContactSmoothing.ts:130`-`:137`).
   3. `AutoMovieHumanLipSmoothing`: wavelength 5 mm, margin 6 mm, depth 4 mm round `AutoMovieHumanVermilionCalibration` (`AutoMovieHumanLipSmoothing.ts:78`-`:84`).
   4. `AutoMovieHumanCornerSmoothing`: Gaussian station line fit, sigma 1.5 mm, core 2 mm, fade 6 mm, cheek 22 mm, band 4 mm at the commissures and lateral canthi (`AutoMovieHumanCornerSmoothing.ts:94`-`:106`).
   5. `AutoMovieHumanStationContinuity`: Gaussian dense-layer line fit, sigma 0.4 mm, and C2 slopes clamped to 1 mm of section change (`AutoMovieHumanStationContinuity.ts:53`, `:60`).
3. `AutoMovieHumanEventJoin.reconcile` (`AutoMovieHumanBodyCalibration.ts:77`; `AutoMovieHumanEventJoin.ts:71`) moves each event child's end ring onto its parent's (taper 6 mm, reach 4 mm, snap 3 mm, 2048 ring samples, `:113`-`:140`) and re-slopes it into the parent's tangent plane (left alone beyond 0.5 mm or where `|N . m| < 0.3`, `:363`, `:385`). `AutoMovieHumanBodyLaw.calibrate` calls it again after the warp (`AutoMovieHumanBodyLaw.ts:104`).
4. Shading repairs in `AutoMovieHumanBodySurface`: `ringBlend` averages normals over 16 passes within 4 mm of every event ring, neighbours within 30 degrees (`:190`-`:301`); `surfaceNormals` keeps the mesh normal where the surface normal differs by more than 30 degrees (`:104`-`:170`, `:307`); `domeBase` and `pole` replace fitted tip rings by a quarter-ellipse dome of 4 rings where the end ring is under 0.35 of the median radius and the apex at least 0.5 of the base radius (`:1123`-`:1276`).

Everything that depends on it:

- `AutoMovieHumanBodyLaw` takes it as the specimen and the base of the basis and the warp (`AutoMovieHumanBodyLaw.ts:6`, `:73`, `:77`, `:85`); `displace` throws unless the basis names every chain and layer (`:141`). `AutoMovieHuman.ts:12`, `skeleton/AutoMovieHumanSkeleton.ts:1` and `packages/playground/src/human/drawHumanPageCurveDiagram.ts:1` reach it through the law.
- `AutoMovieHumanBodyMorphCalibration` (the basis, per chain name and layer), `AutoMovieHumanBodyWarpField`, `AutoMovieHumanBodyWarp`, `AutoMovieHumanBodyGirth` and `AutoMovieHumanBodyLandmarks` read its chain names and layers (see Couplings).
- `skeleton/AutoMovieHumanJointCentres.ts` reads chains `trunk`, `upper`, `head`, `head.middle`, `leg.<side>`, `arm.<side>`, `hand.<side>.1`, `thumb.<side>`, `finger.<side>.<k>`, `foot.<side>`, `toe.<side>.<i>`, `ear.lobe.<side>` and the `head.upper` crown pole (`:95`-`:344`).
- Offline: `fitTrunkBase.ts:41`, `:138`-`:180` takes its starting keys from the `trunk`, `upper` and `head` chains; `fitHeadBase.ts:58`, `:97`-`:107`, `:154` takes its starting keys, its tilted planes and its crown pole from `head.lower`, `head.middle`, `head.upper`; `fitBodyMorph.ts:29` fits the basis on it. `fitHeadBase.ts:59` and `fitHeadReliefs.ts:22` read only the eye apertures.

No rule can tell a fitted corner from noise, and each exists because rows are stored.

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

- `AutoMovieHumanJointCentres` (every limb, hand, digit, foot and toe chain, `trunk`, `upper`, `head`, `head.middle`, `ear.lobe.<side>` and the crown pole of `head.upper`);
- `AutoMovieHumanHeadField` (part ids `human.skin.head/<k>`, `human.skin.head.<sub>/<k>`, `human.skin.ear.<sub>/<k>`);
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

f1 also has `body-sections/` (112 files), cut by `observeBodySections.ts` through Recovery's section API from the body mesh welded to the head mesh's skin, under the Recovery policy `toleranceMm 0.2, maxSpans 256, cornerDegrees 45` stored in each file. Every family file is schema `automovie-human-body-sections-v2`: `{schema, source, policy, crop, planes, around, status, diagnostics, sections}`, each section `{frame, coordinateMm, loops, others, report}` (the trunk rows without `others`), each loop `{curve, winding}`, each curve `{type, name, closed, unit, phaseUnit, phaseIntervals, spans}`, each span `{start, end, startDerivative, endDerivative}`. With `--around`, a plane keeps only its loop round its origin and counts the others in `others`.

| Family | Files | Planes and loops |
| --- | --- | --- |
| trunk rows | `trunk-horizontal-v2.json.gz`, `trunk-planes-v1.json` | 333 horizontal rows from the Rise course's lowest point to the Neck Base course's highest, median gap 2.025 mm, 327 with one loop round the bind axis and 6 with none; 14 to 182 spans per loop |
| arm with palm | `arm_<s>-v2.json.gz`, `-planes-v2.json`, `-root-v2.json`, `-joints-v2.json(.gz)` | 151 bone-normal planes every 4 mm from the shoulder to `middle_01`, one loop each; root key at plane 17; up to 152 (left) and 159 (right) spans |
| leg with foot | `leg_<s>-...` | 248 planes every 4 mm from the hip to `ball`, one loop each; root key at plane 24; up to 149 spans |
| metacarpal and metatarsal heads | `<limb>-heads-v2.json.gz`, `-heads-planes-v2.json` | one plane each, from `planSitePlanes.ts` |
| digits | `thumb|index|middle|ring|pinky_<s>-...` | 33 to 52 planes every 2 mm, up to 6 without a loop past the tip; root key at plane 6 to 22 |
| toes | `bigtoe|indextoe|middletoe|ringtoe|littletoe_<s>-...` | 17 to 31 planes every 2 mm, up to 8 without a loop; root key at plane 7 to 9 |
| joints | `all-joints-v1.json(.gz)`, `<digit|toe>_<s>-joints-v1.json` | joint planes of the bind skeleton |

A `-root-v2.json` is `{module, index, planes, frame, loops}`: the first plane whose loop round the bone no longer winds round the parent axis's crossing (`findRootKeys.ts`). The body mesh alone ends at the seam where the head mesh carries the neck and upper chest; the welded families close across it.

The `ear-observations/` families are schema `reference-ear-section-family-v1` (`{schema, source, sourceSelection, registration, planes, policy, result, scope}`, sections `{coordinateMm, loops}`) or `reference-head-section-planes-v1` (sections `{frame, coordinateMm, loops, report}`), same policy:

| File | Sections | Loops per section |
| --- | --- | --- |
| `horizontal-exterior-v1.json` | 329, every 0.5 mm | 0 to 7 (247 with one) |
| `horizontal-exterior-helix-v1.json` | 71, every 0.1 mm | 2 to 7 |
| `horizontal-exterior-lobe-v1.json` | 36, every 0.1 mm | 0 to 3 |
| `horizontal-exterior-lower-v1.json` | 272, every 0.5 mm | 0 to 2 |
| `horizontal-v1.json` | 169, every 0.5 mm | 1 to 6 |
| `tilted-lower-v1.json` | 237 tilted planes, 0.5 mm apart | 1 to 4 |
| `rim-normal-v1.json` | 73 planes normal to the helices, 3 mm apart | 0 to 2 |

All numbers in this section were printed by `node --max-old-space-size=4096 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/method/observationSchema.ts test/.shots/f1 .shots/claude-scratch/method/observation-schema.txt`.

The head observation (`head-observations.json`) carries the source's landmarks as vertex lists in millimetres, its lateral axis mirrored against the calibration frame: the lid margins, eye folds and creases, the inner and outer eye corners, the medial and lateral brow ends and brow lines, every ear curve (outer and inner helix, central upper and lower, tragus, antitragus, concha, heel) with the lobule connection point, the upper and lower outer lip contours, philtrum and mouth corners, the nostrils, the nasolabial and mentolabial folds, the Frankfurt plane points, and a skull midline curve that stays on the cranium and does not reach the face's skin.

The body observation (`body-observations.json`) carries the measurement courses as native contours (Underbust, Hip, Waist, Rise, Neck Base and the rest, with Bust Span's ends at the apexes) and the bind skeleton, every joint's affine in editor centimetres from the spine and limbs to each phalanx and toe joint.

Fitters may read the meshes and rows; the generator never reads them.

## Shared fitting code

The offline fitters live under `test/src/executable/reference-experiments/human-calibration/` (ignored, private). Their `README.md` and `SESSION-REJECTED.md` describe a removed toolset: the fitters, shared modules and `packages/human/docs/reproduction-status.md` they name do not exist.

`HumanModuleFitting.ts` fits a module's key control points. The surface is `S(s, t) = O(s) + x U(s) + z V(s)` with `(x, z) = sum_k phi_k(s) sum_j B_j(t) c_kj`, `phi_k` the natural cubic cardinal functions of the key stations and `B_j` the periodic cubic B-splines (`:4`-`:11`, `cardinalBasis` `:1140`). Each round samples the surface at 0.5 mm of station and 2N phases, pairs each sample with its nearest observed point within `cap` mm, weights its normal offset by Tukey's biweight (threshold `4.685 x 1.4826 x MAD`, `:398`-`:401`) or by asymmetric least squares, adds a tangential term and a thin-plate energy of the correction from the starting keys, and solves by Jacobi-preconditioned conjugate gradients (`fit` `:461`-`:490`, `pair` `:935`-`:1017`, `fairness` `:1019`-`:1051`). `crossValidated` (`:514`-`:586`) picks the thin-plate length by GCV with Hutchinson's trace estimator. `HumanReliefFitting.ts` fits a relief's tensor-product height net by least squares plus a thin-plate energy on the net, its length by GCV. `fitStrip.ts` fits a strip's trim, reach and interior rows. `HumanImplicitFitting.ts` (Carr et al. 2001 radial basis functions, Quilez's smooth minimum) serves only the auricle experiment set (`fitAuricleSet.ts`, `runAuricleSet.ts`).

Choices that are not a published standard method, or carry an invented constant:

| Code | What it does | Standard method that removes it |
| --- | --- | --- |
| `HumanModuleFitting.ts:971`, `:405`; `CAP` 6 mm in `fitAppendage.ts:48`, `fitBodyBase.ts:69`, `fitTrunkBase.ts:63`, `fitHeadBase.ts:87`, `fitStrip.ts:59` | pairs each surface sample with its nearest observed point within 6 mm; observations no sample reaches never count | foot points of the observations on the surface by point inversion (Piegl and Tiller 1997, The NURBS Book, sec. 6.1), refitted after each solve (parameter correction, Hoschek 1988) |
| `HumanModuleFitting.ts:407`, `:472`; `rounds: 2` in every fitter; `fitStrip.ts:500` | two pairing rounds, then stop whatever the change | alternate projection and solve until the objective stops decreasing; the alternation decreases it monotonically |
| `HumanModuleFitting.ts:1106`, `:1118` | conjugate gradients stop at 4000 iterations or a relative residual of 1e-7 | direct banded Cholesky factorisation (Golub and Van Loan 2013, Matrix Computations, sec. 4.3) |
| `HumanReliefFitting.ts:417`, `fitStrip.ts:716`; `fitStrip.ts:520`, `:682`, `:692`; `HumanModuleFitting.ts:1111`; `HumanReliefFitting.ts:371` | a non-positive Cholesky pivot is floored at 1e-12, and zero divisors are replaced by 1e-12, 1e-300 or 1e-30, so a singular system still returns a solution | Cholesky succeeds exactly when the matrix is positive definite (Golub and Van Loan 2013, sec. 4.2); a non-positive pivot names an unknown that neither data nor penalty reaches, and the fit stops on it |
| `HumanModuleFitting.ts:399`-`:401`, `:468`-`:487`, `:977`-`:985`; `fitStrip.ts:512`-`:523`; thresholds `4.685 x scale` in `fitBodyBase.ts:402`, `fitTrunkBase.ts:438`, `fitHeadBase.ts:479` | Tukey's biweight gives zero weight to every observation more than 4.685 robust scales off; asymmetric least squares weights by the offset's sign | no weight that depends on the residual: the biweight is a published M-estimator, but its zero weights exclude observations by residual; what belongs to a module is the part's data partition, decided before the fit, and every observation's distance is recorded |
| `HumanModuleFitting.ts:729`, `:732`, `:833`, `:961` | key couplings beyond 8 keys and cardinal values below 1e-5 are dropped | exact couplings from a basis taken from the generator's own `compose` |
| `HumanModuleFitting.ts:735`, `:1012`; `fitStrip.ts:61` | a tangential term of weight 0.05 holds samples along their section | point distance minimisation, the full residual vector (Hoschek 1988; Wang, Pottmann and Liu 2006 call it PDM) |
| `HumanModuleFitting.ts:462`-`:465`, `:478`-`:482` | the thin-plate energy acts on the correction from the starting keys, so the result depends on them | a penalty whose null space holds what must not be penalised: the natural-spline roughness in station (Green and Silverman 1994) and the harmonic acceleration operator `D^3 + D` in phase, null space `{1, cos t, sin t}` (Ramsay and Silverman 2005) |
| `HumanModuleFitting.ts:514`-`:586`, `:562`-`:564`; `HumanReliefFitting.ts:89`-`:92`; `fitStrip.ts:592`-`:610` | GCV over single samples, searched by golden section between 1 and 40 mm to a hundredth of the bracket | cross-validation that leaves out whole observed sections (Burman, Chow and Nolan 1994; Roberts et al. 2017), searched by Brent's method (Brent 1973), keeping the smoothest parameters within one standard error of the best (Hastie, Tibshirani and Friedman 2009, sec. 7.10); per-sample GCV assumes independent errors, and samples along one Recovery curve are not (Opsomer, Wang and Yang 2001) |
| `HumanModuleFitting.ts:683`-`:723` (`keyStations`) | keys at ends, joints and sites, merged within one plane spacing, then inserted where neighbours stand farther apart than their mean radius | uniform keys, their number selected by Ruppert 2002's myopic knot search under cross-validation that leaves out whole sections: a larger count only while the held-out score falls |
| `HumanModuleFitting.ts:593`-`:619`; `CYCLES` 4 in `fitAppendage.ts:47`, `fitBodyBase.ts:63`, `fitTrunkBase.ts:57`, `fitHeadBase.ts:79` | starting keys resampled linearly at 4N phases and low-passed at 4 cycles per section | none needed: the penalized fit is convex for fixed foot points, so start keys only seed the first projection |
| N 64, 96 or 128 (`fitAppendage.ts:46`, `fitBodyBase.ts:62`, `fitTrunkBase.ts:56`, `fitHeadBase.ts:77`) | section control count chosen per fitter | the same knot search in phase |
| `HumanModuleFitting.ts:105`, `fitStrip.ts:86`, `fitAppendage.ts:95` and the others | each Hermite span sampled at 8 equal parameter steps, every sample weighted alike | 4-point Gauss-Legendre per span, weighted by arc length and section spacing over the sine of the plane's angle to the skin, the surface element by the coarea formula (Federer 1959), so grazing rows count by the skin they stand for (a squared cubic residual is degree 6, which 4 nodes integrate exactly) |
| `HumanModuleFitting.ts:957`, `:228`, `HumanReliefFitting.ts:281`, `:313`-`:325`, `fitStrip.ts:269`-`:270` | normals and derivatives by differences over 0.05 mm, 1e-3 rad or 1e-4 | the exact jets of `AutoMovieHumanLoftJet.at`; where no jet exists, central differences at the optimal step `eps^(1/3)` (Press et al. 2007, Numerical Recipes, sec. 5.7) |
| `HumanReliefFitting.ts:275`-`:291`, `:157`-`:158` | Newton projection along the axis, 12 iterations to 0.01 mm, failures silently skipped | Newton with the quadratic-convergence bound, every failure dropped and counted |
| `HumanReliefFitting.ts:163` | each 0.5 mm cell keeps only its highest projected point | every observation of the feature's skin counts; points not on it are removed by the part's data partition |
| `HumanReliefFitting.ts:375`-`:396`, `:140`-`:146`, `:352` | axis searched within 70 degrees in 5 and 10 degree steps for the best 5th percentile of `n . a`; feature normals from points 2 to 30 mm off the base within 1 mm, PCA over 2 mm | the axis that maximises the least `n . a` over the fitted relief's normals: the minimum-norm `a` with `n_i . a >= 1` (the cone of normals, Shirman and Abi-Ezzi 1993), solved exactly by the dual active-set method (Goldfarb and Idnani 1983) |
| `HumanReliefFitting.ts:123`-`:124`; `SPACING` 6 mm (`fitTrunkReliefs.ts:32`), 1.5 mm (`fitHeadReliefs.ts:31`); `RINGS`/`MARGIN` 18 and 4.5 mm (`fitTrunkReliefs.ts:34`, `fitHeadReliefs.ts:33`, `fitTrunkBase.ts:66`, `fitHeadBase.ts:88`) | relief control spacing and window growth chosen per fitter | net size by the same knot search per direction; the window is the region plus its three zero rings at that spacing |
| `HumanModuleFitting.ts:280`-`:391` (`basins`, `watershed`), `:183`-`:265` (`standoff`, `project`, foot 3 mm) | stand-off detection of features (experiments: no connected region per feature) | regions from landmarks and root loops, as the fitters now take them |
| `fitAppendage.ts:268`-`:291`, `fitBodyBase.ts:211`-`:236`, `fitTrunkBase.ts:181`-`:197`, `fitHeadBase.ts:209`-`:235` | cap keys `floor(rho pi / 2 / mean spacing)`, sections scaled by `sin(theta)` from the end section | cap keys continue the uniform key spacing to the observed pole and are fitted like every key, so the cap's shape is the least-rough continuation of the end section |
| `fitAppendage.ts:165`-`:170`, `fitHeadBase.ts:156`-`:166` | cap start at the last plane (or calibration layer) whose mean radius is no more than its distance to the pole | cap start by the module's terminal: the last wholly own section before a saddle, the last maximum of section area before a maximum, past which sections close as the square root of the remaining height (Milnor 1963) |
| `fitHeadBase.ts:257` | chart phase scale fixed at 80 mm | the end key's mean distance from the chain's axis, as the other fitters take it |
| `fitHeadBase.ts:396`-`:449` | stiffness halved from 40 mm until the RMS reaches `0.2 / sqrt 3`, bisected 4 times, then up to 8 keys added per pass in 3 passes, 1 mm apart | removed with the non-refit path; the refit already uses cross-validation |
| `fitStrip.ts:123`-`:143`, `fitBodyBase.ts:276`-`:296`, `fitTrunkBase.ts:250`-`:270` | root loop carried onto the parent by the farthest sample within one chart cell of the bone line | each boundary point's orthogonal foot on the parent by point inversion (Piegl and Tiller 1997), its loop parameter the appendage's phase on the point's meridian (Coons 1967), or its phase on its own boundary curve by the chain's correspondence rule where no line gives a pencil (a root loop or a strip region's outer edge, the auricle's); a line intersection is ill-conditioned where the bone's lines graze the skin, as over most of the leg root (Leg) |
| `fitStrip.ts:179`-`:197` | trim control count raised from 4 until every carried point lies within one cell | control points by the same knot search, penalized and cross-validated over the sections its boundary points come from, or over a single root loop's spans |
| `fitStrip.ts:381`-`:436` | reach by doubling and halving from 1, golden section to a hundredth, unpaired samples counted at 36 mm^2 | reach by Brent's method on the strip's objective with the rows profiled out (variable projection, Golub and Pereyra 1973) |
| `fitStrip.ts:446` | interior rows `max(1, floor(mean width / mean key spacing) - 1)` | rows by the same knot search over the sections that cross the strip |
| `fitStrip.ts:114`-`:122`, `:322`-`:378` | a strip's root loop, region and observations from the parent fit's `regions` and `radius`, the `-root-v2` loop and the appendage's planes before that index | the part's geometry and partition record; each column's band width reported and a crossed band stopping the fit |
| `observeBodySections.ts:20`-`:23`, `:170`-`:195`, `:211` (`--around`) | each plane keeps only the loops that wind round its origin, so a family stops where the bone axis leaves the skin: the thumb's bent tip, the lesser toes' flexed tips, a hole in the right index toe's run (Hand, Foot) | topological succession of sections, continued to the source terminal Recovery's section API reports (`terminalSeeds`, `terminals`) |
| `planBodySections.ts:119`-`:126` | a digit's or toe's planes end one bone length past its last joint | planes continued to the terminal's coordinate at the family's own spacing |
| `findRootKeys.ts:64`-`:79`, `:111`-`:116` | a root is the first loop that no longer winds round the parent axis's crossing; the sibling digits are not tested, so three digit roots hold a neighbour's skin (Hand), and a leg root tested against the bind axis alone held both thighs on m1 and m2 ([experiments](experiments.md)) | the joined test against the parent axis and every sibling appendage's bone, for the digits, the toes and the limbs |
| `fitBodyBase.ts:214`-`:215`, `fitAppendage.ts:150`-`:163`, `fitTrunkBase.ts:129`-`:130`, `fitHeadBase.ts:154` | poles: a root loop's centroid, the farthest point along the last bone (in the end plane itself on every digit, Hand), a course's lowest point, the calibration's crown | the first critical point of the section coordinate past the module's last own loop, a maximum or a saddle (Milnor 1963, Morse Theory), as Recovery's terminal observes it |
| `IAutoMovieHumanFeatureChain.ts:85`, `:91`-`:100`; `IAutoMovieHumanRelief.ts:33`-`:34`; `HumanBodySkeleton.ts:37` | modules in world coordinates: a horizontal key's station is its world height, and frames, poles and relief axes are world millimetres; the skeleton is read as joint translations only, though `body-observations.json` records each joint's bind affine | each module in its anchor joint's bind frame, its stations, frames, pole and axes relative to it (hierarchical modelling: Hughes et al. 2014, Computer Graphics: Principles and Practice, 3rd ed., ch. 6) |
| `fitAppendage.ts:297`, `fitBodyBase.ts:241`, `fitTrunkBase.ts:202`, `fitHeadBase.ts:240` | `samples: 2 * N`, the phase count of the generated chain's own rings | not a fitted quantity: the renderer's tessellation of the chain (`IAutoMovieHumanFeatureChain.samples`), to be set from the render |
| `fitBodyBase.ts:70`, `fitTrunkBase.ts:64`, `fitHeadBase.ts:89` (`NEAR` 15 mm) | check counts misses within 15 mm of a region | the surface distance of every observation, with its percentiles, recorded as a report and read by no rule |
| `planBodySections.ts:186` | plane half-width `max(r, theta (rho + r) / 2)` at a joint | a construction keeping neighbouring planes from crossing inside the skin, derived, not cited; kept as the observation plan |
| `measureIdentity.ts:742`, `:629`, `:809`, `:697`, `:882` | gnathion at a 45 degree tangent, 2 mm look-ahead for the narrowing, 130 mm head radius, 3 mm rim band | identity definitions, owned by #2998 |

Every fitter writes its fit to `.shots/claude-scratch/<module>-base.json` (strips `<module>-strip.json`, reliefs `trunk-reliefs.json` and `head-reliefs.json`). No such file exists on this checkout: `find . -name "*-base.json" -o -name "*-strip.json" ...` over the repository printed nothing, and `.shots/claude-scratch/` holds only the four identities, `genall.ts`, `hooks.ts` and `observer.tsconfig.json`.

## Fitters

| Module | Fitter | Fits | State |
| --- | --- | --- | --- |
| trunk base | `fitTrunkBase.ts` | horizontal keys from the leg roots' highest point to the head base's neck ring, cap to the Rise course's lowest point; arm, leg, breast and buttock regions masked | starts from the world-height calibration (`:138`-`:180`) and reads `head-base-biweight.json` for the neck ring (`:121`) |
| breasts, buttocks | `fitTrunkReliefs.ts` | three reliefs over the trunk base | needs `trunk-base.json` |
| head base | `fitHeadBase.ts` | cranium and face mass from the neck ring to the crown, lower keys tilted; lips, nose and auricle regions masked; refit with cap and trunk-owned neck ring when given the trunk | starts from the world-height calibration's head chains and crown pole (`:97`-`:166`); the non-refit path writes `head-base-biweight.json` |
| nose, lips | `fitHeadReliefs.ts` | two reliefs over the refitted head base | needs `head-base-cap.json` |
| auricles | `fitAuricleSet.ts`, `runAuricleSet.ts` | three experimental variants (ribbon, relief, implicit); none exported | experiment only |
| eye openings | `fitEyeCalibration.ts` | lid-margin apertures and globes | writes `AutoMovieHumanEyeCalibration.ts` (current) |
| palms, feet | `fitBodyBase.ts` | wrist (ankle) plane to the metacarpal (metatarsal) heads' plane, cap to the middle digit's root centroid; digit regions masked | complete |
| arms, legs | `fitAppendage.ts` | root plane to the wrist (ankle) key owned by the palm (foot) | needs the palm or foot fit |
| digits, toes | `fitAppendage.ts` | root plane to the cap at the observed tip | complete |
| strips | `fitStrip.ts` | arm and leg on the trunk, digits on the palm, toes on the foot | needs both fits |
| root keys | `findRootKeys.ts` | first plane standing apart from the parent | outputs present (`-root-v2.json`) |
| site planes | `planSitePlanes.ts` | the heads' planes | outputs present |
| identity | `measureIdentity.ts` | ANSUR II and Farkas measures and their sites | outputs present (`.shots/claude-scratch/<alias>-identity.json`) |

No fitter fits a neck module (the trunk's top key is the neck ring) or the nostril openings; the head region's nostril pockets live only in `AutoMovieHumanEarCalibration`.

## Exporter and the generator gap

`exportModules.ts` reads the scratch fits and writes four `IAutoMovieHumanBodyRegion` literals to `packages/human/src/generation/calibration/` (`:33`-`:34`): `AutoMovieHumanHeadModules` (head base with nose and lips reliefs), `AutoMovieHumanTrunkModules` (trunk with breast and buttock reliefs and the four limb strips), `AutoMovieHumanArmModules` and `AutoMovieHumanLegModules` (palm or foot, limb, digits, their strips). Lengths are rounded to 0.001 mm and unitless values to 1e-6 (`:39`-`:40`); an unknown field stops it (`:43`). Every region has `chains: []`, `events: []`, `poles: []`, `trims: []` (`:134`-`:142`). None of the four files exists, and nothing imports them.

To render f1 from them without the world-height calibration, the generator lacks:

1. A calibration built from the modules: `AutoMovieHumanBodyCalibration` merges only the world-height regions and applies the repair rules.
2. Composition: `merge` expands each network alone with `expand` (above), so shared keys lose their owners' derivatives and no chain carries jets.
3. A stature: `merge` requires exactly one region to declare `stature` (`AutoMovieHumanBodyRegions.ts:37`-`:38`); no exported region does.
4. Joins at shared keys: the trunk-head neck ring and the wrist and ankle keys are shared keys, not events or appendages, so `AutoMovieHumanBodySurface.boundary` resolves those ends as poles (`:898`-`:916`) and closes each with a fan.
5. The parts no fitter exports: auricles, nostril openings (with their pockets), the eye apertures and globes in a module region.
6. Re-pointed consumers: the joint centres, girths, body landmarks, warp, basis, skin chart, skin landmarks, skin marks, skin tone, face tone, garment, hair parts and the viewer's close-up framing name world-height chains (Couplings).
7. A law that leaves the modules alone: `AutoMovieHumanBodyLaw.displace` throws on any chain the basis does not name (`AutoMovieHumanBodyLaw.ts:141`).
8. A record of each fit's surface distance: the fits store an inlier RMS (`fitAppendage.ts:331`, `fitBodyBase.ts:530`) or none (`fitHeadBase.ts:544`-`:553`), and the exporter writes none.
9. Module frames: `IAutoMovieHumanFeatureChain` has no anchor, and its keys, pole and relief axes are world coordinates (`IAutoMovieHumanFeatureChain.ts:85`, `:91`-`:100`; `IAutoMovieHumanRelief.ts:33`-`:34`). A module cannot be moved or deformed as a unit without rewriting every value it stores. Apertures and eyes name no chain and carry no frame (`IAutoMovieHumanLoftAperture.ts`, `IAutoMovieHumanBodyCalibration.ts:117`-`:126`), and an outline takes its up from world up, switching to world x when the sine of the forward's angle to world up is below 0.42 (`AutoMovieHumanLoftAperture.ts:120`-`:121`).

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
6. The shared fitting code fits a surface other than the one the generator would render (natural cardinal functions against `compose`'s owner-derivative ends, truncated couplings, `expand` in `merge`), and its pairing, stopping and smoothing rules carry constants no citation gives (Shared fitting code).

## Parts

Each part owner fills only its own subsection.

### Trunk

The numbers of this subsection were printed by these read-only scripts (outputs beside them):

```text
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/trunk/trunkSurvey.ts test/.shots/f1 .shots/claude-scratch/trunk/trunk-survey.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/trunk/trunkSurvey2.ts test/.shots/f1 .shots/claude-scratch/trunk/trunk-survey-2.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/trunk/trunkPartition.ts test/.shots/f1 .shots/claude-scratch/trunk/trunk-partition.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/trunk/trunkFrame.ts test/.shots/f1 .shots/claude-scratch/trunk/trunk-frame.txt
```

Positions are registered millimetres (x forward, y up, z left); an azimuth is measured about the bind axis from forward (0) toward left (90). Left and right agree to the printed digit unless a pair `left / right` is given.

#### Rows, courses and joints

- Trunk rows (`trunk-horizontal-v2.json.gz`): 333 horizontal rows every 2.00 mm from 805.10 to 1469.10 mm, from the Rise course's lowest point to the Neck Base course's highest (`planBodySections.ts:68`-`:69`, `:88`), each with its origin on the bind axis and keeping only its loop round that origin (`observeBodySections.ts:20`-`:23`, `:211`). 327 rows hold one loop and 6 none. The file's status is `partial`, with 443 `Fitting tolerance unresolved` diagnostics over its contours. Loops have 14 to 182 Hermite spans (182 at 1283.10 mm, where the arm joins the row); the 296 rows no root loop cuts (815.10 to 1469.10 mm) have 14 to 144 (144 at 817.10 mm).
- Rows without a loop: 805.10 mm (the crotch, its fit's tolerance unresolved) and 1345.10, 1347.10, 1385.10, 1391.10, 1393.10 mm, all inside the head mesh seam's height range below; their reports hold the cut as open contours (`report.open`).
- Courses, read as `HumanBodySkeleton` reads the joints (`fitTrunkBase.ts:73`-`:76`). Underbust (1189.47 mm), Chest (1260.0 mm, through both apexes), Waist (1105.6), High Hip (1004.2) and Hip (881.1) are horizontal: each course's lowest and highest points coincide.

| Course | Points | What the trunk reads |
| --- | --- | --- |
| Neck Base | 76, closed | 1418.2 mm at the front `(44.5, 1418.2, -12.9)` to 1470.8 mm at the back `(-46.7, 1470.8, 0.0)` |
| Across Shoulder | 16, open | across the back, its ends (the course's shoulder points) at `(-35.4, 1405.9, 132.8)` / `(-35.4, 1405.9, -132.9)`; `measureIdentity.ts`'s acromia lie at `(-16.3, 1388.2, ±180.9)` (`f1-identity.json`, `diagnostics.acromia`) |
| Front Interscye Length | 16, open | ends at the anterior axillary folds `(45.6, 1337.1, 152.1)` / `(45.6, 1337.1, -152.2)`, azimuth ±73.9 |
| Bust Span | 2 | the apexes `(120.4, 1260.0, ±90.5)`, azimuth ±40.7 |
| Chest, Underbust | 81, 66 | lateral-most points at azimuth ±105.8 and ±102.5 |
| Hip | 71 | lateral-most `(36.1, 881.1, 180.5)` / `(40.6, 881.1, -179.0)`, azimuth 86.3 / -84.9; back-most `(-108.3, 881.1, 8.4)` |
| Rise | 18, open | in the plane z = 0, front waist `(125.8, 1105.6, 0)` through the crotch `(-0.3, 805.1, 0)` to the back waist `(-41.7, 1106.8, 0)`; its back points follow the intergluteal cleft |
| Neck to Waist | 7, open | the front midline, z = 0, from 1418.8 to 1105.6 mm |

- Bind joints: `pelvis (24.5, 920.5, 0)`, `spine_05 (10.0, 1284.2, 0)`, `neck_01 (-13.2, 1431.3, 0)`, `neck_02 (-1.8, 1483.3, 0)`; the bind axis lies in z = 0. `upperarm_l (-16.3, 1353.2, 142.2)`, `thigh_l (25.4, 904.8, 96.6)`.

#### Root loops and how they cut the rows

| Root | Plane | Normal | Spans | Perimeter, mm | Heights, mm | Azimuths |
| --- | --- | --- | --- | --- | --- | --- |
| `arm_<s>` | 17 of 151 | `(0.027, -0.795, ±0.606)` | 46 / 43 | 283.6 / 283.8 | 1273.2 / 1273.1 (medial) to 1329.6 (lateral) | 84.5 to 112.3 |
| `leg_<s>` | 24 of 248 | `(-0.021, -0.999, ±0.047)` | 87 / 84 | 647.4 / 647.3 | 803.9 (front-medial) to 813.3 (lateral-back) | 18.7 to 176.8 |

Where a root loop cuts a row is found by intersection, with no tolerance: the root loop meets the row's horizontal plane at points of the line the two planes share, the row meets the root's plane on that same line, and each of the root loop's points takes the row's crossing nearest to it. Each arm loop cuts the rows 1277.10 to 1329.10 mm and each leg loop 807.10 to 813.10 mm, at two crossings in every row. A partner lies at most 1.10 / 0.37 mm (arms) and 0.08 / 0.14 mm (legs) from its root-loop point, and every other crossing at least 13.25 / 14.35 mm (arms) and 65.91 mm (legs) from it; no two root-loop points share a partner (`trunk-partition.txt`). The arc on the distal side measures 239.3 / 239.0 mm down to 14.0 / 14.3 mm per arm and 383.0 / 382.6 mm down to 66.2 mm per leg. The rows 807.10 to 813.10 mm therefore hold both thighs' tops, and no row from 815.10 mm up holds leg skin. The arm's plane also crosses 107 rows without a partner, and 233 rows have samples on its distal side without being cut (`trunk-survey.txt`): a half-space test by the arm plane would take the lower trunk. The leg planes cross no row without a partner.

The axilla: the rows up to 1275.10 mm hold the trunk alone, reaching z 149.4 / -149.5 mm at 1275.10 mm; from 1277.10 mm the arm's lobe joins the row (z 245.3 / -245.4 mm at 1281.10 mm). After the root cut, the arm side of the row still changes at once: between 1275.10 and 1277.10 mm the kept length goes from 883.3 to 955.4 mm and its lateral reach from 149.4 / 149.5 to 156.1 mm, then the reach follows the root plane outward to 184.6 / 185.2 mm at 1299.10 mm.

The armscye plane of a side, through the shoulder point (Across Shoulder's end), the anterior axillary fold (Front Interscye Length's end) and the axilla (the lateral-most point of row 1275.10 mm, `(-40.4, 1275.1, 149.4)` / `(-41.4, 1275.1, -149.5)`), has normal `(-0.125, 0.129, 0.984)` / `(-0.123, 0.131, -0.984)`. It crosses the rows 1275.10 to 1409.10 mm on its side, and no other row. The arm root loop lies -2.65 / -2.93 to 76.91 / 76.82 mm from it, positive on the arm side; its lowest point lies 1.68 / 1.79 mm on the trunk side. The plane through `measureIdentity.ts`'s acromion, the fold and the axilla instead (normal `(0.187, -0.300, 0.935)` / `(0.186, -0.301, -0.935)`) crosses 289 rows from 807.10 to 1389.10 mm, 234 of them below the axilla's row. With both the root cut and the armscye cut, the trunk's side of the rows keeps a lateral reach of 149.4 / 149.5 mm at 1275.10 mm, 153.7 / 154.3 at 1277.10 mm, 152.4 to 154.6 from 1279.10 to 1335.10 mm, falling to 135.4 at 1409.10 and 130.5 at 1411.10 mm; the rows 1277.10 and 1279.10 mm cross the plane four times (the axillary hollow between the arm and the chest wall).

#### The neck and the head mesh seam

- The body mesh has one boundary loop of 92 welded vertices from 1338.4 to 1404.7 mm: front-most `(91.1, 1339.9, -28.0)`, back-most `(-82.7, 1386.8, 61.5)`, lateral-most `(9.0, 1401.4, ±151.5)`. The head mesh's skin (render section 0) has the same loop, so the head mesh carries the upper chest, the shoulder tops and the neck above it. The trunk rows 1339.10 to 1403.10 mm cross the seam, closed by the weld of `observeBodySections.ts:85`-`:113`; the five rows without a loop between 1345.10 and 1393.10 mm lie in it.
- The head families reach down into the neck: `horizontal-exterior-lower-v1.json` from 1400.0 mm (loop points from 1405.0 mm), `tilted-lower-v1.json` from 1425.0 mm. Trunk and head observations overlap from 1405 to 1469.10 mm.
- The trunk's highest row, 1469.10 mm, is a single neck loop of 17 spans and 333.2 mm perimeter, above the seam's top (1404.7 mm) and just below the Neck Base course's highest point (1470.8 mm).
- The Neck Base course is planar: its points lie within 0.00 mm of their orthogonal least-squares plane, normal `(0.500, 0.866, 0.000)` through `(0.5, 1443.6, -0.1)`. The plane crosses the trunk rows 1419.10 to 1469.10 mm, each twice, round the neck (`trunk-frame.txt`).

#### The trunk's frame

From `trunk-frame.txt`. The axis is the natural cubic spline through `pelvis`, `spine_01` to `spine_05`, `neck_01` and `neck_02` by chord length, continued below the pelvis by its end tangent; station is arc length from the pelvis joint. The frame takes v from the hip joints (`thigh_l` minus `thigh_r`, `(0.0, 0.0, 193.3)`) made normal to the tangent at the pelvis, u = t x v, carried by double-reflection rotation-minimising transport; an angle runs about the axis from u toward v.

- Joint stations: `spine_01` 31.78, `spine_02` 89.86, `spine_03` 157.76, `spine_04` 236.07, `spine_05` 369.17, `neck_01` 519.16, `neck_02` 572.46 mm. The tangent lies 0.2 to 15.5 degrees from the bind up axis at the joints (15.5 at `spine_05`, 15.1 at `neck_02`). v is `(0, 0, 1)` to the printed digit at every joint.
- The least radius of curvature between the joints is 100.9 mm, at `spine_01`. Along the principal normal, the trunk rows' points whose axis station lies within 1 mm of a whole-millimetre station from `cap.from` to the neck base plane stay at least 7.9 mm inside that station's radius of curvature (least at 37.00 mm).
- The axis crosses the neck base plane at station 537.86 mm, point `(-10.2, 1449.7, -0.0)`, the plane's normal 18.4 degrees from the tangent. Of the normal planes at whole-millimetre stations from `cap.from` up, 28 meet the neck base plane within the skin's reach, all between 509.00 and 537.00 mm; none below 509.00 mm does.
- The axis continued below the pelvis meets the Rise course at `(32.4, 808.1, -0.0)`, station -112.67 mm, passing 0.021 mm from it; the course's lowest point `(-0.3, 805.1, -0.0)` lies at station -113.35 mm.
- Root loop stations: `leg_<s>` -121.94 to -101.07 mm, `arm_l` 365.13 to 420.71 mm, `arm_r` 364.95 to 420.71 mm. The plane normal to the axis at -101.07 mm, the leg root loops' largest station, passes through `(31.6, 819.7, -0.0)`; the Rise crossing lies 11.61 mm below it, so a cap from there ends at station -119.31 mm.
- Landmarks (station, angle): the apexes 319.62, ±41.9; the anterior axillary folds 411.53, ±72.4; the Across Shoulder ends 494.05, ±99.0. The Underbust course spans stations 257.02 to 294.31 mm and reaches farthest along ±v at angles ±103.0; High Hip 60.10 to 103.71 mm, at 90.2 / -93.8; Hip -46.47 to -29.99 mm, at 87.2 / -85.8; Neck Base 509.57 to 549.73 mm, at ±83.2. Every point of the Rise and Neck to Waist courses lies at angle 0 or ±180 to the printed digit (the frame's sagittal plane).
- In the frame, with 8 points per Hermite span: the point of row 1275.10 mm farthest along v is `(-39.3, 1275.1, 149.4)`, along -v `(-40.7, 1275.1, -149.5)`; the armscye planes through them cross the rows 1275.10 to 1409.10 mm and no other row. The breast regions (from the Underbust course to the anterior axillary fold, angles 0 to the fold's) hold 20533 samples, none on the arm side of an armscye cut, and no arm root loop sample; the buttock regions (from the bottom to the High Hip course, angles from the Hip course's point farthest along ±v to ±180) hold 368 / 398 of the leg root loops' 696 / 672 samples and no arm root loop sample.

#### What the trunk fitters read today

- `fitTrunkBase.ts` reads the world-height calibration (`:41`): its `trunk`, `upper` and `head` chains (`:138`-`:144`) give every starting key, the calibration's horizontal ring at the key's station at 4N phases low-passed to 4 cycles (`:145`, `:170`-`:180`), and the ring radii of the key-station rule (`:156`-`:166`). Its neck ring is the first key of `head-base-biweight.json` (`:121`), which `fitHeadBase.ts`'s calibration path writes at `head.lower`'s bottom layer, 1425 mm (`fitHeadBase.ts:101`). Its other choices: keys at the identity's trunk sites (`:147`-`:154`), N 96 or 128 (`:56`), cap keys scaled by `sin(theta)` from the end key at the leg roots' highest point (`:128`, `:181`-`:197`), observations from the saved loft and the trunk family (`:224`-`:229`), regions carried onto the starting surface by the nearest-cell rule (`:249`-`:296`), breast discs from the apex to the Underbust course and buttocks from the Waist course, both grown by 18 mm (`:66`, `:308`-`:362`), a mask (`:406`-`:407`), the biweight with GCV (`:415`-`:424`) and a 15 mm check (`:440`-`:500`). It writes `regions` and `radius` (`:502`-`:524`), which `fitStrip.ts` reads for the limb strips (`:114`, `:340`-`:359`).
- `fitTrunkReliefs.ts` reads nothing of the calibration. Its windows are the base fit's region boxes grown by 18 mm, three spacings of 6 mm (`:32`-`:34`, `:108`-`:121`), the buttocks' not at the bottom (`:123`-`:127`); it writes a bare array of reliefs (`:137`), as `exportModules.ts:159` reads it.
- Consumers of the trunk's world-height chains: `AutoMovieHumanJointCentres.ts:95`-`:137` (hip, lumbar and thoracic stations on `trunk`, the neck base at the top of `upper`, the neck radius from `head`), `AutoMovieHumanBodyGirth.ts:78`-`:84` (girth extremes of `trunk`) and `AutoMovieHumanBodyLandmarks.ts:155`-`:173` (acromion and shoulder breadth from the widest section of `upper`, the neck level at its top). In the calibration, `trunk` runs 804.87 to 1276.57 mm (28 layers), `upper` 1276.57 to 1404.51 mm (13) and `head` 1404.51 to 1699.67 mm (184), all of order 256. `trunk` splits down into both legs at 804.87 mm, `upper` into `trunk` and both arms at 1276.57 mm with pinch arcs, and `head` continues into `upper` at 1404.51 mm.

#### Defects and their causes

The repaired calibration (`AutoMovieHumanBodyCalibration`) was compared with every trunk row along eight azimuths.

| Defect | Traced cause |
| --- | --- |
| Abdominal band at about 1040 mm, strongest on f2 (#2985) | At the front midline the rows' radius falls from 95.98 mm at 1039.10 mm to 87.15 mm at 1047.10 mm and then holds 86.66 to 86.41 mm to 1059.10 mm; at azimuth 10 it falls from 100.27 to 90.80 mm over the same rows without that plateau (the navel). The calibration's `trunk` layers at 1033.79 and 1043.79 mm stand -0.91, +1.93 and -0.69 mm off the rows at 1039.10, 1047.10 and 1059.10 mm there. On f2 the measurement law's waist knot scales that layer region more than its neighbours (#2985). Causes: whole sections stored per height carry a midline feature (root causes 1 and 2), and the law's knot |
| Horizontal gluteal fold | The calibration closes `trunk` with a horizontal contact ring into both legs at 804.87 mm. At the back midline it stands 5.26 mm outside the row at 809.10 mm, and its station second difference there is -1.457 mm per mm squared against the rows' -0.436. Along azimuths 150, 165 and 172 the rows' radius rises without a fall from 807.10 to 875.10 mm and peaks at 875.10, 885.10 and 891.10 mm, so the fold's crease lies at or below the leg root loops (803.9 to 813.3 mm), on the leg. Causes: the horizontal contact ring (root cause 3) |
| Armpit lump | `upper` carries the arm's lobe in its horizontal sections above its split at 1276.57 mm: along azimuth 90 both the rows and the calibration jump by the lobe between 1275.10 and 1277.10 mm (station second differences 24.188 and -24.389 mm per mm squared in the rows, 24.170 and -24.379 in the calibration, at 1275.10 and 1277.10 mm), and `ringBlend` averages normals within 4 mm of the ring. Even with the arm's arcs cut at its root loop, the trunk's side of the row changes at once there (above). Causes: one section per height across the axilla (root cause 2) and the contact ring (root cause 3) |
| Thigh line at the crotch ring | The same ring at 804.87 mm, where the shape folds (Open defects) |
| Vertical striations on the backs of the thighs, the trunk's share | `trunk`'s sections from 804.87 mm, order 256, hold the buttocks and the thigh tops above the crotch with layers at 804.87, 807.00, 808.00, 811.00, 816.00, 819.00, 826.00 and 833.79 mm: phase noise of 256-point sections fitted to faceted rows (root cause 1) |
| Calibration filling the intergluteal cleft | Along the back midline it stands 1.15 to 2.12 mm outside the rows from 815.10 to 915.10 mm, where `AutoMovieHumanContactSmoothing` applies its `trunk` low-pass of 50 mm wavelength; not separated from the layer fit |

The rows at the front midline from 825.10 to 837.10 mm hold a narrow feature that a 35-control section misses by up to 7.24 mm (the shared method's resolution table); it lies on the Rise course's front points `(73.4, 819.7, 0)` to `(107.6, 841.5, 0)`, the genital region the Human skill leaves out of the modelled skin.

### Head

The numbers of this subsection were printed by these read-only scripts (outputs beside them):

```text
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/head/headCalibration.ts .shots/claude-scratch/head/head-calibration.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/head/headObservations.ts test/.shots/f1 .shots/claude-scratch/head/head-observations.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/head/headTopology.ts test/.shots/f1 .shots/claude-scratch/head/head-topology.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/head/headAxis.ts test/.shots/f1 .shots/claude-scratch/head/head-axis.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/head/headRegions.ts test/.shots/f1 .shots/claude-scratch/head/head-regions.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/head/headNostrils.ts test/.shots/f1 .shots/claude-scratch/head/head-nostrils.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/head/headConcha.ts test/.shots/f1 .shots/claude-scratch/head/head-concha.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/head/headCapArea.ts test/.shots/f1 .shots/claude-scratch/head/head-cap-area.txt
```

Positions are registered millimetres (x forward, y up, z left). Landmark positions of `head-observations.json` take their lateral axis mirrored, as `fitEyeCalibration.ts:53`-`:57` mirrors it, so the left eyelid lies at +z; after the mirror the Frankfurt points `pt_frankfurt_fl` and `_rl` and the outer lid edges `crv_outer_eyelid_edge_right_*` lie at -z, so those names count their side the other way. Left and right agree to the printed digit unless a pair `left / right` is given.

#### Joints and the head's frame

- Bind joints (`head-observations.txt`): `neck_01 (-13.19, 1431.27, -0.02)`, `neck_02 (-1.81, 1483.32, -0.02)`, `head (9.07, 1537.35, -0.02)`. Only `neck_02` and `head` lie above `neck_01`: the skeleton has no jaw, eye, ear or other facial joint.
- The line from `neck_02` through `head` (55.11 mm) leans 11.39 degrees forward of world up; `neck_01` to `neck_02` leans 12.33 degrees, 0.94 degrees from it. Station below is arc length along that line from `neck_02`.
- The Frankfurt points (orbitales and porions) span a plane whose normal lies 7.71 degrees from the line and 3.69 degrees from world up; the fourth point lies 0.10 mm off the plane through the other three. The orbitales' midpoint minus the porions' midpoint, made normal to the line, is `(0.98, -0.20, 0.01)`.
- The Neck Base course plane (normal `(0.50, 0.87, 0.00)`, survey Trunk) crosses the line at station -35.07 mm; the course spans stations -54.70 to -21.09 mm. `head` lies at 55.11 mm.
- The crown, the exterior's farthest vertex along the line, is `(51.72, 1696.37, -0.22)` at station 219.42 mm, 10.42 mm in front of the line; the highest vertex `(15.34, 1699.69, -0.32)` lies at 215.50 mm. Landmark tops: ear curves 118.19, upper lid contact lines 133.60, eye creases 135.97, brow lines 153.33 mm.

#### The head mesh's sheets and openings

- `head-native.json` has render sections 0 (skin, 48004 triangles) and 1 to 8 (mouth interior and eye parts, among them the eyeballs 3 and 4, 1536 triangles each). The head-common exterior selection (`sections.head-common-ear-left-crosscourse-v1.json`, `head-common-exterior-v1`) keeps 37420 triangles, all of section 0; the 10584 others of section 0 form five disks (`head-observations.txt`, `head-topology.txt`), each bounded by one loop of the exterior:

| Disk | Triangles, area | Its boundary loop lies on (mean / largest distance, mm) |
| --- | --- | --- |
| oral (lips and mouth lining) | 7304, 16017.3 mm2 | the outer lip contours with the philtrum, 0.36 / 0.86: the vermilion border; the loop's box equals the endpoint box of `AutoMovieHumanVermilionCalibration` |
| eyelid interiors | 1136 each | the outer lid edges, 0.86 / 1.80 and 1.13 / 1.65; the lid contact lines 0.94 / 2.14 and 1.81 / 2.83 |
| nostrils | 504 each | `crv_nostril_*`, 0.42 / 0.90 and 0.31 / 0.67 |

- The landmark positions are not vertices of this mesh: each lies 0.02 to 2.97 mm from the nearest head-native vertex (the lid contact lines up to 1.48 mm, the outer lip contours up to 0.87 mm, the ear curves up to 2.97 mm; `head-regions.txt`), mirror pairs differ (the lobule connections 1.99 / 0.50 mm) although the mesh is mirror-symmetric, and the `vertexIds` they carry do not index head-native's vertices (278.8 mm apart; `head-topology.txt`). The `inner_lips` feature is a zipper definition of `vertexIds` without positions, so it cannot be placed on this mesh.
- The vermilion: 2077 of the oral disk's triangles (1232.9 mm2, one connected piece, stations 49.5 to 73.8 mm, lateral -22.9 to 23.8 mm) see out of the head along the front axis without meeting another triangle; the rest of the oral disk lies behind the lip contact.
- Each nostril's boundary loop lies within 0.75 / 0.66 mm of its least-squares plane; the plane normal, oriented away from the disk, is `(0.58, -0.72, 0.39)` / `(0.58, -0.74, -0.34)`, 0.90 / 0.66 degrees from the stored apertures' `forward`; the disk's deepest point lies 7.96 / 7.93 mm behind the plane, against the stored pockets of 8.96 / 8.68 mm (`head-nostrils.txt`).

#### Head families against the sheets

Nodes at 8 per Hermite span, each labelled by its nearest triangle (`head-observations.txt`):

| Family | Sections | Loops, open pieces | Nodes on a disk or another render section |
| --- | --- | --- | --- |
| `horizontal-exterior-lower-v1` | 272, 1400.0 to 1535.5 mm | 216, 72 | oral 53 |
| `horizontal-exterior-v1` | 329, 1536.0 to 1700.0 mm | 446, 74 | eyelids 38 / 37, nostrils 17 / 7; eyeballs and other sections 7050 |
| `horizontal-exterior-helix-v1`, `-lobe-v1` | 71 and 36, at 0.1 mm | 328 and 78, 56 and 2 | eyeballs and other sections 8002 (helix) |
| `horizontal-v1` (all of section 0) | 169, 1530.0 to 1614.0 mm | 277, 0 | oral 9981 in 45 sections, eyelids 1750 / 1811, nostrils 853 / 950 |
| `tilted-lower-v1` (exterior with the disks below 1570 mm restored) | 237, origins 1425.0 to 1543.0 mm | 299, 0 | oral 12261 in 53 sections |
| `rim-normal-v1` | 73 | 62, 33 | disks 8, other sections 9 |
| saved loft, rows above 1400 mm | 2597 | 12993, 0 | oral 142083, eyelids 48600 / 40049, nostrils 1054 / 835; other sections 658702 |

The exterior families include the eyeballs (sections 3 and 4) so that rows cross the palpebral openings (`observeEarSections.ts:103`-`:113`); `tilted-lower-v1` and `horizontal-v1` run into the mouth along the lips' inner faces; the exterior families' rows end at the disks as open pieces.

#### Sections along the head

- Normal planes of the line (`head-topology.txt`): one closed exterior loop from station -54 to 48 mm; open chains where a plane crosses the mouth (50 to 74), the nostrils (84 to 90) and the eyes (122 to 132); one loop holding both auricles from 92 to 112 mm (largest area 24377.5 mm2 at 100), 2 or 3 loops at 114 to 118 mm (the helices); from 134 mm one loop, its area largest at 138 mm (23786.5 mm2) and falling to the crown. At 0.5 mm (`head-cap-area.txt`) the largest loop's area has one local maximum from 120 mm on, 23786.7 mm2 at 138.5 mm; the sections are closed from 134.0 mm.
- Planes normal to the lateral axis signed toward each ear's landmarks, every 0.5 mm (`head-concha.txt`). Closed loops begin at 54.0 / 53.5 mm; nearer planes cross the exterior's open edges and openings as open pieces. The ear landmarks' least offsets are 65.32 / 66.68 mm (the outer helix and the lobule connection), the Frankfurt rear point on the ear's side lies at 72.56 / 72.71 mm and is the one named `_rr` / `_rl`.
  - Holes, loops nested in the head's: one from 64.5 / 64.0 to 69.5 mm, largest 51.7 / 50.2 mm round 185.8 / 170.8 mm2, which opens into the outer loop at 70.0 mm; one from 72.5 to 73.0 mm, largest 14.8 / 17.2 mm round 14.8 / 19.0 mm2.
  - Splits, each a pinch joined to the kept loop between two planes: at 73.5 mm a 28.2 / 23.6 mm loop of the helix's curl, whose distal skin (the exterior reached through triangles wholly past the plane) holds the nearest mesh vertex of 19 / 6 ear landmark vertices; at 76.5 / 75.5 mm the cranium's 132.2 / 160.1 mm loop, whose distal skin holds none, leaving the auricle's loop of 180.0 / 181.4 mm round 546.3 / 543.4 mm2; at 91.0 / 89.0 mm a 14.2 / 21.7 mm curl that ends within 0.5 mm. The auricle's last loop lies at 96.5 / 94.5 mm, its maximum at 96.63 / 94.80 mm.
  - The auricle loop's area falls without rising from the root to the tip on the left; on the right it falls to 314.1 mm2 at 82.5 mm, rises to 324.0 mm2 at 86.0 mm and falls again. The root loop's area centroid lies outside the loop, and the line from it to the maximum, 42.7 / 44.9 degrees from the axis, lies inside no loop from the root to 81.0 / 80.5 mm and from 90.5 / 88.5 to 95.0 / 93.5 mm.
  - The pit below the first hole, the exterior reached from its triangles at 69.5 mm through triangles wholly below that plane: 241 / 244 triangles, 316.7 / 303.5 mm2, its floor at 64.22 / 63.67 mm, 5.28 / 5.83 mm below the plane; all of it inside the ear landmarks' convex hull seen along the axis; `ear_concha_<s>` within 8.22 / 8.34 mm of it; the origin lies in the hull of its normals (upper bound 0.000, 6 / 16 normals facing away from the best axis); seen along the axis, 40 / 41 of its triangles (59.4 / 53.4 mm2) and 16 of the hole's 79 / 73 points lie inside the root loop. The pit below the second hole: 29 / 34 triangles, 30.5 / 33.5 mm2, 0.53 / 0.58 mm deep, least cosine 0.741 / 0.663, 0 / 2 triangles inside the root loop.
  - The ear outline, the convex hull seen along the axis of the ear landmark vertices, the root loop and the first pit: 148.0 / 152.0 mm round 1313.8 / 1444.2 mm2, front -21.1 to 17.1 / -24.6 to 14.6 mm, station 61.0 to 117.5 / 60.7 to 118.2 mm. Inside it, past the root plane, 26.2 / 9.0 mm2 of skin off the auricle's component (stations 111.8 to 116.7 / 115.9 to 117.2 mm, up to 77.61 / 75.95 mm out); 628.4 / 14.7 mm2 of the component (2987.9 / 2964.6 mm2) projects outside it. Under 35 / 17 of the outline's 169 / 177 one-millimetre samples, along the axis, the only near-side skin is the component's (stations 73.8 to 114.8 / 105.4 to 114.4 mm, behind and above the ear).
  - The near-side exterior inside the outline that is off the component, with the component's skin wholly before a plane: its outer boundary, the edge with skin neither in it nor on the component past that plane, reaches 77.61 / 76.54 mm, so the first plane past the root that it lies wholly before is 78.0 / 77.0 mm, whose loop is 168.2 / 170.5 mm round 470.1 / 451.4 mm2. With that plane the region has one piece of 1945.2 / 2113.6 mm2 (offsets 59.50 to 78.00 / 59.02 to 76.98 mm, Euler characteristic 0, 97 / 89 outer boundary vertices) and on the left two pieces of the component of 14.7 and 8.5 mm2.
- The submental skin: the area-weighted 10th percentile of its angle to the line's normal planes is 3.4 to 13.7 degrees at stations 8 and 10 mm within 20 mm of the midsagittal plane, and 16.1 degrees or more 20 to 50 mm out along the jaw (`head-regions.txt`); to the horizontal it is 4.1 to 7.5 degrees (`head-topology.txt`). A cubic from the neck ring centre with the Neck Base plane's normal as its tangent to `head` (or through `head` to the crown) turns its normal planes from 30.0 degrees at the ring to 8.3 to 12.2 degrees at stations 0 to 10 mm and leaves them 1.3 to 2.8 degrees from the skin there (`head-axis.txt`). No curve through the neck and head joints crosses the submental skin steeply: the joints lean 11 to 12 degrees and the skin 4 to 8 degrees.

#### Feature regions as height fields

Bounds on `max_a min_i n_i . a` over the region's exterior triangle normals, by Gilbert's minimum-norm point of their convex hull (`head-observations.txt`, `head-regions.txt`; a region's triangles are the exterior's whose centroids fall inside the convex hull of its landmarks seen along a direction and lie no deeper along it than its deepest landmark: the front axis, for the auricles the lateral axis signed outward, for the chin the bisector of front and down):

| Region | Least cosine | Axis |
| --- | --- | --- |
| nose: nasion estimate, inner eye corners, nostrils | 0.013 to 0.016 | `(0.97, -0.26, 0.00)` |
| nose as `fitHeadBase.ts:314`-`:316` takes it (with the alar points) | none: the origin lies in the hull; 94 triangles at stations 92 to 98 mm, 15 to 18 mm lateral, face backward | - |
| lips: outer lip contours, mentolabial fold, mouth corners, exterior and vermilion | 0.114 to 0.115 | `(0.98, -0.17, -0.07)` |
| chin: mentolabial fold and the Neck Base course's front half, on the head's side of its plane | 0.108 to 0.109 | `(0.95, -0.32, 0.00)` |
| chin and jaw to the lobule connections; brows (brow line and eye crease) | none | - |
| auricles (every ear landmark) | none | - |

#### The eye openings

- `AutoMovieHumanEyeCalibration`: Fourier order 24, `forward (1, 0, 0)`, depth 4, no `base`; margins 1587.23 to 1597.74 / 1586.82 to 1597.43 mm high, 77.63 / 77.37 mm long; globes `(96.06, 1594.83, 31.48)` / `(94.71, 1593.90, -31.59)`, radius 11.392 mm (`head-calibration.txt`). Both are absolute world coordinates.
- `AutoMovieHumanEyelid.create` puts the medial canthus at 16.92 / 16.89 mm and the lateral at 14.68 / 14.54 mm from the gaze axis, beyond the globe's 12 mm radius; 135 / 134 of its 360 margin samples lie past 0.95 of that radius, where the posterior edge keeps the margin's own depth instead of resting on the globe (`AutoMovieHumanEyelid.ts:240`-`:249`).
- World axes the eye code reads: the gaze `forward` (1, 0, 0) (`fitEyeCalibration.ts:283`, `AutoMovieHuman.ts:179`), up as world up made normal to it (`AutoMovieHumanEyelid.ts:293`, `AutoMovieHuman.ts:180`), the medial canthus as the one nearer z = 0 (`AutoMovieHumanEyelid.ts:188`-`:190`), the outline's lateral as `forward x` world up (`AutoMovieHumanLoftAperture.ts:120`-`:124`).
- An opening with a `base` takes the trim path: `AutoMovieHumanBodySurface.ts:446`-`:466` projects its outline onto the base (`AutoMovieHumanBodyRoots.trim`), the base leaves the cells inside unlofted, and `open` (`:761`-`:808`) zips the base's hole to the loop and builds the lid band (`AutoMovieHumanEyelidSurface.loop`, one column per lid sample) or the pocket (`AutoMovieHumanAperturePocket.loop`) from the base's derivative across the loop. Such an opening leaves the context's apertures before lofting (`:451`-`:453`), so `refine` (`:576`) refines no station near it. No calibration opening has a `base` today.
- Rule constants of the lid (`AutoMovieHumanEyelid.ts:57`-`:75`: band 2.5, depths 1.0 and 0.8, offset 0.25, taper 5, merge 0.3, gap 0.03, clearance 0.5 mm; `AutoMovieHumanEyelidProfile.ts:12`, `:18`, `:24`, `:109`) and of the pocket (`AutoMovieHumanAperturePocket.ts:16`, `:121`-`:123`) are appearance conventions of the generator, not fitted values.

#### What the head fitters read

- `fitHeadBase.ts` reads the world-height calibration (`:58`): `head.lower`, `head.middle`, `head.upper` (`:97`-`:107`) for its station range, tilted planes and start keys (the calibration's rings smoothed to 4 cycles, `:193`-`:207`), its crown pole (`:154`) and its end key (`:155`-`:166`); the eye apertures (`:59`, `:109`-`:127`). Its other rules: the identity's sites as keys (`:169`-`:192`), the `sin(theta)` cap (`:209`-`:235`), regions from landmark hulls on a 256-column chart of radius 80 mm (`:246`-`:347`), a mask grown by 4.5 mm (`:377`-`:381`), the biweight with stiffness halving and key insertion (`:396`-`:449`) or GCV (`:458`-`:467`), and the 15 mm check (`:481`-`:538`).
- `fitHeadReliefs.ts` reads the eye apertures (`:22`, `:47`-`:65`) and the base fit's `regions` and `radius` (`:43`, `:90`); windows are region boxes grown by 4.5 mm (`:31`-`:33`, `:96`-`:97`), the nose fitted before the lips (`:82`).
- `fitAuricleSet.ts` and `runAuricleSet.ts` read the base fit's chain, `regions`, `radius` and `scale` only; `fitEyeCalibration.ts` reads `AutoMovieHumanEyeGlobe` only; `planHeadSections.ts` reads nothing and carries `TILT` 0.25, `RISE` 62.5, `HOLD` 12.5, `FALL` 36 mm (`:34`-`:39`), the planes of `tilted-lower-v1`.
- `EarSectionGeometry.ts` (imported by nothing) carries the eyeball test (`x > 70`, `|z|` 12 to 52, perimeter below 110 mm, `:171`), the 0.3 mm stitch and 8 mm bridge (`:201`, `:220`) and the slit rule (40, 20, 2.5 and 60 mm, `:261`-`:285`).

#### Observations on f1 only

`ear-observations/` (all seven families) and `body-sections/` exist on f1 alone. `head-native.json`, `head-observations.json`, `body-observations.json`, the saved loft and the head-common section families (the exterior selection among them) exist for f1, f2, m1 and m2 (`ls test/.shots/<alias>`).

#### Defects and their causes

| Defect | Traced cause |
| --- | --- |
| Ledge from each lateral canthus to the temple, line at eye height (#2978, #2979) | One section per height crosses the eyes: the exterior rows at 1586.5 to 1597.5 mm break at the palpebral openings (open pieces) and the fitter interpolated across them (Open defects); `head.middle`'s layers at 1589.0 to 1595.5 mm carry 30 to 52 curvature sign changes and `head.upper`'s at 1596.3 mm 34 (`head-calibration.txt`); the eye apertures come from landmark curves 0.94 to 1.81 mm (mean) off the observed eyelid edge (sheets table), so the cut outline and the lofted skin come from different surfaces |
| Lateral canthus open past the globe, lid teeth (#2979) | The canthi lie 14.5 to 16.9 mm from the gaze axis, beyond the 12 mm globe, where the posterior edge keeps the margin's depth (above); the opening is clipped by position out of a bridged loft (`AutoMovieHumanBodyApertures.ts:223`-`:426`, no `base`), and the lid band takes one column per cut vertex (`AutoMovieHumanEyelidSurface.ts:28`-`:87`), so its columns follow the clipped triangles |
| Auricle stairs, ripples, helix-root trace, rim and lobe joins (#2984) | The auricles ride in `head.middle`'s whole-head sections (29 layers, 16 to 52 sign changes); the helix, rim, pocket and lobe chains have layers 0.1 mm apart with up to 36 sign changes; the helices leave through one up event at 1595.5 mm and the lobes through a down event at 1543.2 mm, joined by the event join and `ringBlend` |
| Lip notch at each commissure, light patch at the left one (#2980) | `head.lower`'s tilted layers ring at the lips (6 to 18 sign changes from 1519.0 mm up); the oral line crosses those layers; the lip and corner repair rules act after the fit (World-height calibration and its repair rules). The light patch is not traced further |
| Rough nostril rims (#2983) | The nostril apertures have no `base`, so they are clipped by position out of a bridged loft, and the pocket starts from cut triangles' jets averaged along the rim (`AutoMovieHumanAperturePocket.ts:67`-`:88`) rather than the skin's own derivative; the stored pocket depths exceed the observed cavity's by 1.00 / 0.75 mm |
| Line under the chin | `head.lower`'s layers at 1494.5 to 1502.0 mm advance unevenly (Open defects); every plane family through the neck joints grazes the submental skin (3.4 degrees at station 8 mm), so one plane meets the throat and the next the chin underside, which `planHeadSections.ts`'s invented tilt profile met |
| Vertical striations on the forehead | `head.upper`'s 256-point layers from 1608.5 to 1698.5 mm show no curvature sign change above 1/50 per mm, so the striations lie below that scale: phase noise of 256-point sections fitted to faceted rows (Open defects), not traced further |

### Hand

The numbers of this subsection were printed by these read-only scripts (outputs beside them):

```text
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/hand/surveyHandObservations.ts test/.shots/f1 .shots/claude-scratch/hand/survey-observations.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/hand/surveyHandRoots.ts test/.shots/f1 .shots/claude-scratch/hand/survey-roots.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/hand/surveyHandComponents.ts test/.shots/f1 .shots/claude-scratch/hand/survey-components.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/hand/surveyHandCoverage.ts test/.shots/f1 .shots/claude-scratch/hand/survey-coverage.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/hand/surveyHandCalibration.ts .shots/claude-scratch/hand/survey-calibration.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/hand/surveyHandHeadsCrossing.ts test/.shots/f1 .shots/claude-scratch/hand/survey-heads-crossing.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/hand/surveyHandFrame.ts test/.shots/f1 .shots/claude-scratch/hand/survey-frame.txt
```

Left and right agree to the printed digit unless a pair `left / right` is given.

#### Joints and frames

- Bind joints (`HumanBodySkeleton.read`): the hand bone (`hand` to `middle_01`) is 80.1 mm long. Along it from the wrist, `index_01` lies at 80.5 mm (22.4 mm off the bone), `middle_01` at 80.1, `ring_01` at 71.8 (18.6 off), `pinky_01` at 65.6 (36.3 off), `thumb_01` at 21.0 (26.4 off). Bones: thumb 43.4 (`_01`-`_02`) and 25.0 (`_02`-`_03`); index 40.9 and 20.9; middle 44.0 and 27.0; ring 37.1 and 29.5; pinky 26.6 and 16.7. About the plane through `hand` spanned by the hand bone and the knuckle line (`index_01` to `pinky_01`), `thumb_01` lies 17.68 mm to one side and every finger's `_02` and `_03` lies on the same side, 13.02 to 35.78 mm; the middle finger's bend points that way by 2.15 mm (`surveyHandFrame.ts`).
- The arm family (`arm_<s>-v2.json.gz`) is one axis from the shoulder to `middle_01` (`planBodySections.ts:108`), its planes every 4 mm counted from each joint and closed at the axis's last point (`:193`-`:196`). The wrist plane, through `hand_<s>`, is index 129 of 151; its normal lies 1.2 degrees from both the forearm and the hand bone (the joint's slerp bisector, `:198`-`:211`). The palm range 129..150 spans 80.1 mm; plane 149 lies at 80.0 mm and plane 150 at 80.1 mm, at `middle_01`. Every palm plane keeps one loop round its origin (`observeBodySections.ts:211`), with 2 other loops left out at planes 129..144 and 3 at 145..150; the loops have 9..33 / 11..27 Hermite spans.
- The metacarpal heads' plane (`arm_<s>-heads-planes-v2.json`, `planSitePlanes.ts:41`-`:52` from the identity's `metacarpalHeads` site, which passes through `index_01` and `pinky_01` and holds the palm's normal, `measureIdentity.ts:551`-`:558`): one loop of 18 / 14 spans; its origin's foot lies 73.1 mm past the wrist; its normal lies 15.1 degrees from plane 150's. Palm planes 145..150 (64.0 to 80.1 mm past the wrist) meet it inside both loops; planes 129..144 meet it inside neither.
- Digit families (`<digit>_<s>-v2.json.gz`): planes every 2 mm counted from each joint (`planBodySections.ts:193`-`:196`), from `_01`, continued past `_03` by the last bone's own length (`:119`-`:126`). The extension continues the last bone, so `_03` is straight and turns no plane (`:177`-`:186`); the planes turn only at `_02`, within its half-width (`:186`). Each plane keeps only its loop round its origin. No digit plane holds two loops.

| Digit | Planes | `_02`, `_03` plane | `-root-v2` index (spans, mean radius mm) | Separated root (spans, mean radius mm) | Last loop plane | Planes past it (loops / others) |
| --- | --- | --- | --- | --- | --- | --- |
| thumb | 49 | 22, 35 | 22 (19 / 20, 11.1 / 10.3) | 22 (19 / 20, 11.1 / 10.3) | 43 | 44..48: 0 / 9, 8, 8, 8, 8 |
| index | 44 | 21, 32 | 8 (8 / 7, 8.6 / 9.2) | 8 (8 / 7, 8.6 / 9.2) | 43, the family's last | none |
| middle | 52 | 23, 37 | 9 / 10 (21 / 18, 12.4 / 9.1) | 10 (14 / 18, 8.5 / 9.1) | 47 | 48..51: 0 / 3 |
| ring | 50 | 19, 34 | 11 / 10 (16 / 27, 8.4 / 11.8) | 11 (16 / 13, 8.4 / 7.7) | 43 | 44..49: 0 / 3 or 2 |
| pinky | 33 | 14, 23 | 6 / 7 (28 / 16, 20.9 / 7.3) | 7 (13 / 16, 7.4 / 7.3) | 32, the family's last | none |

- A root loop is separated when it winds neither round the palm axis's crossing (as `findRootKeys.ts:56`-`:57`, `:111`-`:116` tests) nor round the crossing of any other digit's bone polyline (`surveyHandRoots.ts`). The `-root-v2` loops of the left middle (plane 9), the left pinky (plane 6) and the right ring (plane 10) still wind round the left index's, the left middle's and ring's, and the right middle's crossings: they hold a neighbour's skin. The thumb's root is its `thumb_02` plane, so the thumb stands apart from the palm only at its metacarpophalangeal joint.
- Joined sections: digit planes before the separated root hold loops joined to the palm and to neighbouring digits, and the thumb's (normal to its metacarpal) cut across the palm.
- A digit's skin is the connected part of the body mesh strictly distal of its separated root plane (`surveyHandComponents.ts`): 421, 562, 556, 547 and 565 vertices for thumb to pinky, none holding another digit's seed, none overlapping. Labelled by nearest mesh vertex (at most 3.1 mm away), the joined sections hold digit skin: the palm planes 145 / 168 thumb and 122 / 128 pinky samples (8 per span), the thumb's sections 361 / 437 ring and 274 / 348 pinky samples, the other digits' sections 9 to 166 samples each of their neighbours. The rest, 14959 / 14685 samples of 81 sections, is palm skin; its largest loops have 33 / 27 (palm planes), 18 / 14 (heads), 46 / 45 (thumb), 34, 37 / 36, 39 / 40 and 34 / 37 spans (index to pinky sections).
- The palm skin's sample farthest along plane 150's normal lies 19.9 mm past it, from the pinky's section 6, 1.3 mm off the hand bone's line and 11.8 / 9.3 mm from the middle root loop's mean point. Root loops past plane 150: thumb -31.1..-17.5 / -31.2..-17.5, index 12.0..18.5, middle 15.0..21.4, ring 8.3..15.2 / 8.4..15.2, pinky -6.5..1.6 / -6.4..1.7 mm. The thumb's root loop lies 48.9..62.6 mm past the wrist along the hand bone and 40.9..62.0 / 62.1 mm off it.

#### Tips and coverage

- Every digit's farthest observed point along its last bone lies in its last loop's plane (0.0 mm past it): the planes past it hold no loop round their origin.
- Over the body-mesh vertices nearest a hand bone segment, the distance to the nearest observed hand point (`surveyHandCoverage.ts`): palm median 0.78 / 0.79, maximum 2.75 / 2.68 mm; thumb median 0.82 / 0.83, maximum 12.32 / 12.33 mm, its worst vertex 10.89 mm past the last loop plane; pinky maximum 5.68 / 5.71 mm, worst 4.42 mm past; index, middle and ring maxima 2.84, 3.56 / 3.63 and 3.57 / 3.54 mm, worst 1.50, 1.83 and 1.64 mm past.
- The thumb's tip bends off its last bone: the farthest vertex along the bone lies 27.0 mm past `thumb_03` and 4.5 mm off it, and planes 44..48 cut the tip only as loops that do not wind round their origins (the 8 or 9 others). The pinky's skin continues past its family's last plane, one bone length past `pinky_03`.
- `measureIdentity.ts:447`-`:458` takes a fingertip as the mesh vertex farthest along the last bone within that bone's length of it. For the index and ring that vertex lies 20.7 and 28.0 mm off the bone, on a neighbour; for the middle (`handLength`) 0.9 mm and the thumb (`thumbLength`) 4.5 mm.

#### World-height hand calibration and its consumers

- `AutoMovieHumanTorsoCalibration` per side, read as stored: `arm.<s>` (order 128, arclength rule, 24 layers from 957.6 to 1276.6 mm); `hand.<s>.1` (order 64, 6 layers, 936.5..957.6 mm), `hand.<s>.2` (64, 4 layers, 926.2..936.5), `hand.<s>.3` (32, 2 layers, 920.6..926.2), arclength rule, horizontal; `thumb.<s>` (32, polar, 7 layers) and `finger.<s>.<index|middle|ring|little>` (16, polar, 7 or 8 layers, gaps up to 20.00 mm on the middle), horizontal sections of the hanging digits. The palm's layers have 12 to 16 curvature sign changes each (median 12 to 14, `hand.<s>.1` up to 16 / 14 at 936.5 mm), the digits' 0 to 8.
- Events: `arm.<s>` splits at its bottom ring (957.6 mm) into `thumb.<s>` and `hand.<s>.1`, so the wrist ring is the thumb's root; `hand.<s>.1` into index and `hand.<s>.2`, `.2` into middle and `.3`, `.3` into ring and little, each a down event at pinch phases. Ten critical poles close the digits' bottom ends; no trim names a hand chain.
- Repairs acting on them: `AutoMovieHumanContactSmoothing`'s `arm|hand` row (`:135`), the event join, and `domeBase` domes over the critical poles (`AutoMovieHumanBodySurface.ts:565`-`:568`, `:1211`); the warp scales every `hand|thumb|finger` chain of a side by one ratio, the hand circumference measured on `hand.<s>.1` (`AutoMovieHumanBodyWarpField.ts:285`-`:299`); Retirement deletes the warp.
- `AutoMovieHumanJointCentres`: the wrist at the `arm.<s>` bottom end (`:200`), the hand's radius from `hand.<s>.1` (`:233`-`:240`), the thumb's metacarpophalangeal joint at the `thumb.<s>` top end and its tip at the pole (`:244`-`:273`), each finger by `phalanges` with the web at the chain's last station (`:274`-`:300`, `:389`-`:397`) in the conventional `FINGER` units (`:373`).
- `AutoMovieHumanNail` places plates on chains matching `^(finger|thumb|toe)\.(left|right)(?:\.(\w+))?$` (`:100`-`:101`) and takes the palmar direction from the `hand.<side>.` prefix (`:229`, `:249`-`:251`); the skin carries no nail geometry (`:18`). `AutoMovieHumanSkinLandmarks` reads `hand.<side>.`, `thumb.<side>` and `finger.<side>.` (`:106`-`:141`); `AutoMovieHumanSkinMarks` (`:338`-`:340`) and `AutoMovieHumanSkinTone` (`:230`-`:232`) the `hand.`, `finger.` and `thumb.` prefixes.

#### What the hand fitters read

No hand fitter reads the world-height calibration; `fitStrip.ts:40` imports only the `IAppendage` type. `fitBodyBase.ts` (palm path) reads the arm family, the heads plane, the digit families and root files and the joints (`:90`-`:95`, `:130`-`:132`, `:214`, `:250`-`:262`), names the palm `palm.<side>` (`:238`), ends it at the heads plane (`:165`-`:178`) and caps it to the middle root loop's centroid by `sin(theta)` (`:214`-`:236`). `fitAppendage.ts` (digit path) reads the digit family, its root file and the joints (`:83`-`:85`), names a digit by its family (`:76`, `index.left`, `pinky.left`) and ends it by the radius rule (`:155`-`:171`). `fitStrip.ts` (digit strips) reads the palm and digit fits, the digit's `-root-v2` loop (`:120`-`:122`), and the arm, heads and digit families (`:106`-`:113`, `:322`-`:338`); its observations are the palm's inside the carried region plus the digit's planes before the `-root-v2` index (`:340`-`:378`).

#### Open defects and their causes

| Defect | Cause |
| --- | --- |
| Web creases and palm ringing (world-height calibration, rendered today; #2986) | The webs are horizontal down-event rings cut at pinch phases (root causes 2 and 3); the palm's 64-point layers ring with 12 to 16 curvature sign changes; the contact low-pass and event join repair them after the fit (root cause 4) |
| Thumb rooted in the wrist ring (world-height calibration) | `arm.<s>` splits into thumb and palm at its bottom ring, so the thumb's root and the wrist are one horizontal ring; the observed thumb stands apart at its `thumb_02` plane, 48.9 mm or more past the wrist |
| Fingertip shape from repairs (world-height calibration; #2986) | Critical fan poles replaced by `domeBase` domes after the fit |
| Root loops holding a neighbour's skin: left middle, left pinky, right ring | `findRootKeys.ts:111`-`:116` tests only the palm axis's crossing, never the other digits' bones; on the mirror-symmetric body the two sides' Recovery fits separate those loops one plane apart |
| Digit tips unobserved: thumb up to 12.3 mm, pinky 5.7 mm | The origin test (`observeBodySections.ts:211`) drops the thumb's bent tip; the pinky's planes stop one bone length past `pinky_03` (`planBodySections.ts:122`-`:126`) |
| A cap closing at its own end plane | Every digit's farthest observed point lies in its last loop's plane, so the cap's pole height above `cap.from` (the shared Caps rule, and `fitAppendage.ts:155`-`:170`'s pole) is zero or set by the truncated family |
| Palm data holding digit skin | `fitBodyBase.ts:250`-`:256` takes every digit section before the `-root-v2` index and all palm planes; they hold the thumb's and pinky's skin past their roots and the oblique thumb sections hold the ring's and pinky's; only the cell-rule mask (`:276`-`:370`) removes any |
| Palm keys crossing the end key inside the skin | `fitBodyBase.ts:165`-`:178` ends the palm at the heads plane, 15.1 degrees from the family planes, and moves its keys to the nearest family planes up to `middle_01` (`planeAt`, `:154`-`:158`), among them planes 145..150, which meet the heads plane inside the skin |
| The palm's distal closure is not the skin's | The cap pole is the middle root loop's centroid, inside the finger, and cap keys are scaled by `sin(theta)` (`fitBodyBase.ts:214`-`:236`) |
| Digit regions on the palm by the cell rule and a mask; digit strip trims by the same rule | `fitBodyBase.ts:276`-`:370`, `fitStrip.ts:120`-`:197` (rows of the Shared fitting code table) |
| Exported names miss every consumer | `palm.<side>` (`fitBodyBase.ts:238`) and `index.<side>`, `pinky.<side>` (`fitAppendage.ts:76`) against `hand.<side>.`, `thumb.<side>` and `finger.<side>.<index|middle|ring|little>` |
| Index and ring fingertip sites on a neighbour (identity, #2998) | `measureIdentity.ts:447`-`:458` searches a cylinder as wide as the last bone is long |
| Nails without cuticle folds (appearance; #2986) | `AutoMovieHumanNail` lays plates on the skin and reconstructs no fold (`:51`); no skin module carries nail geometry |

### Arm

The numbers of this subsection were printed by these read-only scripts (outputs beside them):

```text
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/arm/armSurvey.ts test/.shots/f1 .shots/claude-scratch/arm/arm-survey.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/arm/armFrames.ts .shots/claude-scratch/arm/arm-frames.txt test/.shots/f1 test/.shots/f2 test/.shots/m1 test/.shots/m2
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/arm/armCoverage.ts test/.shots/f1 18 18 .shots/claude-scratch/arm/arm-coverage.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/arm/armElbowFan.ts test/.shots/f1 l .shots/claude-scratch/arm/arm-elbow-fan.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/arm/armCalibration.ts test/.shots/f1 .shots/claude-scratch/arm/arm-calibration.txt
```

Positions are registered millimetres (x forward, y up, z left). Left and right agree to the printed digit unless a pair `left / right` is given. A meridian is a half-plane through the humerus line, its angle measured about the line from the front axis toward along × front.

#### Joints, frames and the anchor

- Bind joints (`HumanBodySkeleton.read`): `upperarm_l (-16.3, 1353.2, 142.2)`, `lowerarm_l (-9.1, 1140.1, 304.9)`, `hand_l (140.7, 993.5, 427.2)`; upper arm 268.18 mm, forearm 242.71 mm, `clavicle_l` to `upperarm_l` 135.13 mm. The elbow bends 36.65 degrees and the wrist 2.49 degrees; the humerus lies 37.38 degrees from world down (the bind pose abducts the arms, Experiment findings). On f2, m1 and m2 the elbow's bend, the humerus's direction and the front axis below agree with f1's to the printed digit (`arm-frames.txt`).
- Axes from joint centres: along, `upperarm` to `lowerarm`, is `(0.027, -0.795, 0.606)` / `(0.027, -0.795, -0.606)`; front, the forearm's direction (`lowerarm` to `hand`) made normal to along, is `(0.998, 0.056, 0.029)` / `(0.998, 0.056, -0.029)`, 3.64 degrees from world forward; along × front is `(-0.057, 0.604, 0.795)` / `(0.057, -0.604, 0.795)`, toward the body's left on both arms. As a check only: the rig's corrective joints `upperarm_bicep` and `upperarm_fwd` lie off the humerus 0.71 and 0.40 degrees from front on f1, `upperarm_tricep` and `upperarm_bck` 170.33 and 175.23 degrees from it; over the four people the bicep joint lies 0.71 to 18.48 degrees from front and the tricep joint 170.33 to 171.82 degrees.
- The anchor's record: `upperarm_<s>`'s `bindNativeAffineColumnMajor16`, registered as the translations are, is orthonormal to `max |A^T A - I|` 1.15e-6 / 1.04e-6, and its polar factor (Higham's iteration) turns no column at the printed digit. Its columns are minus along, front and minus along × front on the left arm, and along, minus front and minus along × front on the right. `lowerarm_<s>`'s third column lies 180 degrees from along × forearm, so the rig's elbow hinge is the joint centres' bend axis. `HumanBodySkeleton.read` keeps the translations only (`HumanBodySkeleton.ts:36`-`:39`).
- The palm's front by the Hand's rule lies 98.55 degrees from the arm's front (98.55 to 99.68 over the four people). The arm's front, made normal to plane 18's normal and carried plane to plane by double-reflection transport to the wrist plane, lies 99.57 / -99.57 degrees from the palm's front there.

#### The arm family and its root

- The arm family (`arm_<s>-v2.json.gz`) is one axis `upperarm`, `lowerarm`, `hand`, `middle_01` (`planBodySections.ts:107`-`:111`): 151 planes over 590.94 mm, counted every 4 mm from each joint (`:193`-`:196`), `u` from world forward (`:144`-`:148`). Joint planes: `upperarm` 0, `lowerarm` 68 (268.18 mm), `hand` 129 (510.88 mm), `middle_01` 150. The planes turn across the elbow at planes 59 to 77 / 59 to 76 and across the wrist at 123 to 135 (`:186`, `:197`-`:212`).
- Inside the elbow's turn (left arm, `arm-elbow-fan.txt`) neighbouring planes meet 107.2 to 115.0 mm from their origins toward meridian 0, the flexion side, and each loop's point nearest the next plane lies 30.0 to 34.8 mm from its origin. Plane 67 lies just before the elbow's plane, since planes are counted from each joint, so its loop comes within 0.12 mm of plane 68 without crossing it. From plane 18 to 128 no loop reaches past its next plane, and no loop straddles plane 18's or the wrist plane, nor do theirs straddle it.
- Every plane keeps one loop round its origin (`observeBodySections.ts:211`), with 0 to 5 others left out; the file's status is `partial`, with 251 / 249 diagnostics. Planes 0 to 16 hold loops joined to the trunk, of 83 to 152 / 75 to 159 spans; planes 17 to 128 hold 6 to 62 / 6 to 68 spans, the most at plane 43.
- The separated root: plane 17, 68.00 mm from `upperarm` (46 / 43 spans, perimeter 283.6 / 283.8 mm, the `-root-v2` key of `findRootKeys.ts:49`-`:55`, `:111`-`:116`), is the first plane whose loop winds round neither the trunk axis's crossing nor the crossing of the other arm's or either leg's bone polyline. Planes 0 to 16 wind round the trunk axis's crossing only, so the shared sibling test keeps plane 17 on f1.
- Coverage: over the connected part of the welded skin strictly between plane 18 and the wrist plane that holds the vertex nearest the elbow joint (2267 vertices), the distance to the nearest observed point of planes 18 to 128 has median 1.18 / 1.15, 99th percentile 2.54 / 2.51 and maximum 3.16 / 3.04 mm; within 40 mm of the elbow joint's station the maximum is 2.78 / 3.04 mm (`arm-coverage.txt`).

#### The arm's share of the trunk rows

The armscye plane and the cuts below are the Trunk's (survey, Trunk), recomputed in `arm-survey.txt`.

- The armscye plane lies 60.63 / 60.70 degrees from the root plane's normal. `upperarm_<s>` lies 0.05 / 0.00 mm from it, and the humerus line crosses it 0.1 / 0.0 mm from the joint. The armscye boundary by the Trunk's rule, the two crossings of each row from 1275.10 to 1409.10 mm met first from the row's front and back midline points, which bound the trunk's arcs (126 points, both found on all 63 rows), winds once round that crossing, and its meridian turns monotonically along it; so does plane 18's loop's (`arm-coverage.txt`).
- The rows 1277.10 and 1279.10 mm cross the plane four times. Their arcs, in order, are arm 12.8, trunk 16.6, arm 256.5, trunk 1147.5 mm and arm 16.8, trunk 3.3, arm 252.9, trunk 1109.6 mm on the left, and arm 254.8, trunk 17.9, arm 11.6, trunk 1149.1 mm and arm 252.3, trunk 4.6, arm 15.5, trunk 1110.2 mm on the right: a short trunk arc inside the axillary hollow between two arm-side arcs.
- At 32 samples per span the rows hold 39996 / 40145 samples between their two boundary crossings on the arm's side (the strip region by the Trunk's rule, the hollow's short trunk arcs included) and not distal of the root loop, and 16230 / 17216 distal of it.
- Plane 17's loop lies -2.65 / -2.93 to 76.91 / 76.82 mm from the armscye plane (positive on the arm side), and the armscye boundary reaches 0.08 / 0.19 mm past plane 17. Plane 18 is the first plane with the whole boundary before it, at least 3.92 / 3.81 mm; its loop lies -2.05 / -2.09 to 78.21 / 78.11 mm from the armscye plane, its points on the trunk's side 1268.9 to 1272.2 / 1272.3 mm high, below the axilla's row, where the rows hold the upper arm apart from the trunk. Plane 17's points on the trunk's side lie 1273.2 / 1273.1 to 1277.0 / 1277.2 mm high. Plane 20 is the first whose loop lies wholly on the arm side (from 0.08 / 0.05 mm).
- On 64 meridians the chord from the armscye boundary to plane 18's loop runs from 4.3 / 3.9 mm at meridian -73.1 / 73.1 degrees, the front of the axilla, to 123.5 mm at 101.3 / -101.2 degrees, over the shoulder; the axilla lies at meridian -125.1 / 126.1 degrees and the shoulder point at 122.7 / -122.7 degrees.
- Along the root plane's normal toward the trunk, the lines of 193 of the separated root loop's 368 points (8 per span) / 185 of 344 enter no trunk row's kept polygon (the trunk's side after the root cuts and the armscye split by the Trunk's rule, its gaps closed by chords). All of them lie 1304.2 to 1329.6 mm high and 48.2 / 48.0 to 76.9 / 76.8 mm on the arm side of the armscye plane, where the humerus's direction passes over the shoulder; the others enter 3.9 / 2.4 to 103.0 mm from their points.
- Coverage of the strip's skin (welded skin on the arm side of the armscye plane, proximal of plane 18, nearest the clavicle, the humerus or the forearm; 311 / 309 vertices): against the rows' strip region (by the Trunk's rule, not distal of the root loop) alone, median 0.67 / 0.66 and maximum 6.30 / 6.37 mm, at `(-39.7, 1270.0, 152.9)` / `(-39.7, 1270.0, -153.0)`, below the axilla's row; with plane 17's loop as well, maximum 4.43 mm, at `(-26.4, 1393.1, 170.8)` / `(-26.4, 1393.1, -170.9)` on the shoulder.

#### World-height arm calibration and its consumers

- `AutoMovieHumanTorsoCalibration`'s `arm.<s>` (`arm-calibration.txt`): order 128, rule `arclength`, 24 horizontal layers from 957.6 to 1276.6 mm, 1.0 to 40.0 mm apart (40.0 mm from 1033.8 to 1073.8 mm). Between its layers its axis lies 28.5 to 63.2 degrees from the vertical, the angle at which each horizontal section cuts the arm off its cross-section. Its bottom axis point lies 54.2 mm from `hand_<s>`, 51.2 mm along the 80.1 mm hand bone, inside the palm; its top axis point lies 94.3 mm from `upperarm_<s>`. `upper` splits down at its bottom ring (1276.57 mm, Trunk) into `trunk` and the arms, the arms' arcs `[1.133..2.308]` and `[3.975..5.149]`; `arm.<s>` splits down into `thumb.<s>` and `hand.<s>.1` (Hand). No trim or pole names an arm chain.
- Repairs acting on it: `AutoMovieHumanContactSmoothing`'s `upper` row (20, 20 and 15 mm) at the axillary ring and its `arm|hand` row (`:132`, `:135`), whose comment records that "the axillary ring rang 56 times on the shoulder side and 62 on the trunk's (a lump at the front of each armpit under raking light)" (`:38`-`:40`); the event join; `ringBlend` within 4 mm of the ring; the warp's stretch of each arm along its axis from the axillary ring (`AutoMovieHumanBodyWarpField.ts:56`-`:57`, `:359`-`:388`, `:668`-`:688`) at the girth stations of `AutoMovieHumanBodyGirth.ts:96`-`:106`.
- `AutoMovieHumanJointCentres.ts:172`-`:232`: the arm's radius at its top station (`:174`); the shoulder height `min(0.8 S, top of upper)` and the glenohumeral and sternoclavicular points from `upper`'s ring there (`:175`-`:199`); the wrist at `arm.<s>`'s bottom end (`:200`), inside the palm; the elbow at `0.162 / (0.162 + 0.151)` of the polyline from that glenohumeral point down the arm's stations (`:201`-`:204`); the forearm's radius at the station `(elbow y + wrist y) / 2`, a height taken as a station (`:231`).
- `AutoMovieHumanSkinLandmarks.ts:109`-`:110`, `:122`-`:129`, `:149`-`:163`: the wrist is the arm chain's extreme nearer the palm's centroid, the elbow the point 0.55 of the way between the chain's extremes, its spread 0.07 of their distance. `AutoMovieHumanSkinTone.ts:233`-`:258` fades palmar skin in on `arm.` chains from that wrist, and `:260`-`:275` takes the elbow's posterior side against world -X (`:268`). `AutoMovieHumanSkinMarks.ts:336` weights freckles 0.6 on `arm.`. `AutoMovieHumanGarmentBody.ts:295`-`:306` covers no arm part, and `:336`-`:340` takes the axilla as the trunk part's highest vertex, the axillary ring.

#### What the arm fitters read

- Neither reads the world-height calibration: `fitAppendage.ts:38`-`:39` imports two types, and `fitStrip.ts:38`-`:46` imports generator modules and the `IAppendage` type.
- `fitAppendage.ts` (arm path) reads the arm family, its planes and its `-root-v2` file (`:83`-`:85`) and the palm's fit as the wrist key's owner, and requires the palm's first key at the arm's own station of the wrist plane (`:141`-`:148`). It keys the separated root, the elbow, the identity's `upperArmGirth`, `forearmGirth` and `wrist` sites (`.shots/claude-scratch/<alias>-identity.json`) and the wrist plane, merged by `keyStations` (`:50`-`:53`, `:202`-`:235`); carries the key axes back from the palm's key (`:239`-`:242`); names the chain `arm.<side>` (`:76`); takes N 64 (`:46`); and fits the planes from the root through the wrist plane (`:307`) with the biweight, `CAP` 6 mm, two rounds and GCV (`:322`-`:327`).
- `fitStrip.ts` (arm path) reads the trunk fit's `radius` and `regions["arm_<s>"]` (`:114`, `:340`-`:359`), the `-root-v2` loop with its plane's normal as the trim direction (`:120`-`:122`) and the carried rule (`:123`-`:143`). Its observations are the saved loft and the trunk rows between the trunk fit's cap pole height and its last key's station, both world heights, keeping loops that wind round the bind axis at the point's height (`:283`-`:320`), inside the carried region (`:360`-`:366`), plus the arm family's planes before the `-root-v2` index (`:367`-`:377`).

#### Open defects and their causes

| Defect | Cause |
| --- | --- |
| Armpit lump at the front of each armpit (world-height calibration, rendered today; #2985) | The arm's top ring is `upper`'s horizontal contact ring at 1276.57 mm, cut at pinch phases; it rang 56 and 62 times before the contact low-pass (`AutoMovieHumanContactSmoothing.ts:38`-`:40`), which with the event join and `ringBlend` repairs it after the fit (root causes 2, 3 and 4); the Trunk subsection traces the trunk's side |
| Wrist joint centre and the palmar fade's wrist inside the palm (world-height calibration) | `AutoMovieHumanJointCentres.ts:200` and `AutoMovieHumanSkinLandmarks.ts:122`-`:129` take the wrist at the arm chain's bottom, 54.2 mm from `hand_<s>`, where `arm.<s>` splits into the thumb and the palm |
| Elbow placed by fractions of chain extremes, its back against world -X (world-height calibration) | `AutoMovieHumanJointCentres.ts:201`-`:204` and `AutoMovieHumanSkinLandmarks.ts:149`-`:163` place the elbow by fractions of polylines whose ends are an estimated glenohumeral point or the axillary ring and the bottom inside the palm; `AutoMovieHumanSkinTone.ts:268` reads world -X |
| Arm trim off the trunk over the shoulder | `fitStrip.ts:123`-`:143` carries each root-loop point along the root plane's normal and, failing a sample within one cell of that line, takes the nearest sample; for 193 / 185 points the line meets no trunk, since the humerus's direction lies 60.63 / 60.70 degrees from the armscye's normal |
| Strip crossed at the axilla | The armscye boundary reaches 0.08 / 0.19 mm past the separated root's plane, and its loop 2.65 / 2.93 mm onto the trunk's side of the armscye plane: the separated root is the first plane past the axillary saddle, where the trunk's boundary also passes |
| Strip observations counted twice and selected by the cell rule | `fitStrip.ts:283`-`:378` takes the trunk's nodes in its carried region (saved loft and trunk rows) and the arm planes before the root, whose joined loops observe skin the trunk rows observe |
| The arm fit observes the palm's wrist plane | `fitAppendage.ts:307` keeps the planes through the wrist plane, the palm's key (Hand) |
| The wrist key's owner refused | `fitAppendage.ts:147` requires the palm's first key at the arm's station of the wrist plane; the palm's stations start at 0 at the wrist (Hand) |
| Arm keys at sites and joints | `fitAppendage.ts:202`-`:235` (the `keyStations` row of the Shared fitting code table) |
| The arm's axes and keys in the world | The planner's `u` from world forward (`planBodySections.ts:144`-`:148`) and keys stored in the world with no anchor (the module-frame row of the Shared fitting code table) |

### Foot

The numbers of this subsection were printed by these read-only scripts (outputs beside them):

```text
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/foot/footSurvey.ts test/.shots/f1 .shots/claude-scratch/foot/foot-survey.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/foot/footCoverage.ts test/.shots/f1 .shots/claude-scratch/foot/foot-coverage.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/foot/footKeyPlanes.ts test/.shots/f1 .shots/claude-scratch/foot/foot-key-planes.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/foot/footFrames.ts test/.shots/f1 .shots/claude-scratch/foot/foot-frames.txt
```

Left and right agree to the printed digit unless a pair `left / right` is given.

#### Joints and frames

- Bind joints (`HumanBodySkeleton.read`): the ankle `foot_<s>` stands 74.69 mm high, the ball 9.24 mm. The foot bone (ankle to ball) is 148.98 mm long, 26.06 degrees below the horizontal, and bends 65.72 degrees from the calf bone. Each toe has two joints, `_01` and `_02` (`planBodySections.ts:100`-`:105`), and none at its tip. The `_01` joints lie 138.7 (little) to 152.9 mm (big) along the foot bone from the ankle; `_01` to `_02` is 15.21 (little) to 28.94 mm (index), 12.87 to 19.64 degrees off the foot bone.
- The leg family (`leg_<s>-v2.json.gz`) is one axis from the thigh to the ball (`planBodySections.ts:109`): 248 bone-normal planes every 4 mm counted from each joint (`planBodySections.ts:193`-`:196`, so plane 208 lies 0.8 mm before the ankle plane), each keeping only its loop round the plane's origin on the bone (`observeBodySections.ts:20`-`:23`). The ankle plane, through `foot_<s>` and normal to the bisector of the calf and foot bones, is index 209; the foot range 209..247 holds 39 planes over 149.0 mm to the ball plane. The planes turn from the calf direction to the foot direction over planes 197..221, stations -44.8 to 48.0 mm from the ankle plane (the half-width of `planBodySections.ts:186`). Loops in the foot range have 17 / 15 to 66 / 68 Hermite spans. No loop of planes 195..247 reaches past its next plane, and no two planes of 209..247 meet inside either one's loop.
- The plane frames take u from world forward, or from world up where the normal is within `acos 0.8` of forward (`planBodySections.ts:144`-`:148`), so u changes reference inside the ankle turn; `fitBodyBase.ts:180`-`:198` carries the axes from the first key by rotation-minimising transport.
- The metatarsal heads' plane (`leg_<s>-heads-planes-v2.json`, written by `planSitePlanes.ts:41`-`:52` from the identity's `metatarsalHeads` site): one loop of 18 / 19 spans; normal 11.36 degrees off the foot bone; origin 145.8 mm along the axis from the ankle plane, 10.64 mm off it, 17.02 mm high. Leg planes 244..247 (stations 140 to 149 mm) meet it inside their loops, their points lying -14.5 / -14.4 to 11.6 / 11.7 mm about it; planes 209..243 do not.
- Toe families (`<toe>_<s>-v2.json.gz`): planes every 2 mm counted from each joint (the little toe's plane 8, its root, is its `_02` plane at 15.2 mm), normal to `_01`-`_02`, continued past `_02` by that bone's own length (`planBodySections.ts:119`-`:126`). The axis is straight, so its one interior joint turns nothing (`:177`-`:186`) and every plane of a toe is parallel. The root key (`<toe>_<s>-root-v2.json`, `findRootKeys.ts:58`-`:59`, `:111`-`:116`) is the first plane whose loop no longer winds round the crossing of the foot axis (ankle to ball, extended).

| Toe | Planes | Root index (station mm) | Root loop spans | Root loop past the heads plane, mm | Own run (root to the first plane without a loop) | Planes after the run |
| --- | --- | --- | --- | --- | --- | --- |
| big | 31 | 8 (16.0) / 7 (14.0) | 35 / 51 | 12.3..25.9 / 10.3..25.0 | 8..28 / 7..28 | 29, 30: no skin |
| index | 31 | 8 (16.0) | 51 / 47 | 12.7..25.1 / 12.7..25.0 | 8..24 / 8..21 | 25..28 / 22..28 cut its skin; right plane 23 holds a loop again |
| middle | 25 | 8 (16.0) | 33 / 40 | 15.8..25.0 | 8..23 / 8..22 | 24 / 23, 24 cut its skin |
| ring | 23 | 9 (18.0) | 36 / 48 | 15.7..24.2 | 9..15 | 16..20 cut its skin, 21, 22 none |
| little | 17 | 8 (15.2) | 13 / 8 | 13.1..17.9 / 13.0..17.8 | 8..13 | 14..16 cut its skin; the family ends there |

- Every root loop lies wholly beyond the heads plane. The toe planes before their roots hold forefoot loops joined to the toe and reach across the heads plane (the little toe's from -15.5 / -15.4 to 16.7 mm about it). The largest loop of the foot's observations (leg planes from the ankle, heads, toe planes before their roots) has 66 / 68 spans.
- The reference mesh is mirror-symmetric (Experiment findings) and the joints agree to the printed digit, yet the root indices, span counts and runs differ by side: the Recovery fits of the two sides' planes differ, not the skin.

#### Sole and heel

The foot planes, tilted 26.06 degrees from vertical with the foot bone, cross the flat sole at a wide angle, so the lower arc of every foot plane observes it: the lowest points of planes 216..247 lie between -1.23 and 0.13 mm, on the floor. The heel lies inside the ankle turn. Below the ankle joint and behind it along the foot bone the mesh has 110 vertices per side; 87 are nearest a foot plane (index 209 on) and 23 a leg plane before the ankle plane. The heel's most posterior vertex lies 32.4 mm behind the ankle along the foot bone, 70.5 mm high and 16.1 mm behind the ankle plane, so the upper back of the heel is skin of the leg's turning planes 197..208; below, planes 209..216 cut the heel, their loops reaching back to -25.8 mm (209) and -7.9 / -8.1 mm (214) along the foot bone and down to 6.54 / 6.71 mm (214) and 0.07 / 0.13 mm (216). The turning planes fan: the loops of planes 197..207 come within 1.17 to 2.33 mm of their next plane at 4 mm axis spacing, so the fan converges on one side of the axis and spreads on the other, and the heel's posterior face, which faces back along the foot bone, is grazed by the planes past the turn. The heel's distance to the nearest observed point has median 1.83 / 1.75 mm and maximum 4.55 mm, 46 / 48 of its vertices lying beyond half the 4 mm spacing.

#### Coverage and the toe tips

Over the 3452 mesh vertices per side past plane 197, the distance to the nearest observed point has median 0.84 / 0.90, 99th percentile 9.27 / 9.78 and maximum 10.86 / 12.91 mm; 699 / 763 vertices lie beyond 2 mm. By nearest bone, those beyond 2 mm are the foot bone's 145 ahead of the ankle joint (at most 4.6 / 4.4 mm) and 62 / 63 behind it (4.6 mm), and the toes': ring 177 / 179 (10.8 / 10.9 mm), index 128 / 150 (10.9 / 12.9 mm), little 159 / 163 (7.5 / 7.6 mm), middle 25 / 59 (4.5 / 6.1 mm), big 3 / 4 (3.7 mm). The worst reach 11.7 mm (ring), 9.2 / 15.2 mm (index), 7.7 mm (little), 2.5 / 4.5 mm (middle) and 1.1 mm (big) past the toe's last observed plane: the lesser toes' tips are not observed.

#### World-height foot calibration and its consumers

- `AutoMovieHumanFootCalibration` (17 chains, from `foot-sections-v1.json.gz` of `observeFootSections.ts`): `foot.<s>` (order 256, arclength rule, 18 layers on planes through one lateral line), `forefoot.left.1`-`2` against `forefoot.right.1`-`3`, `toe.<s>.1` (hallux) to `.5` (polar rule, order 32 or 64); 9 events (4 left, 5 right), 10 toe poles at the chains' bottom ends, and leg trims at stations 113.5 / 112.5 mm. The two sides' trees differ, and so do their poles: `toe.left.1` at x 199.873, z 146.868 against `toe.right.1` at x 199.297, z -150.56.
- Repairs acting on it: `AutoMovieHumanContactSmoothing` row `foot|forefoot` (`:136`), the event join, and the tip domes of `AutoMovieHumanBodySurface` (`:565`-`:568`, `domeBase` `:1211`); the warp holds `ear|foot|forefoot|toe` chains fixed (`AutoMovieHumanBodyWarpField.ts:404`).
- `AutoMovieHumanJointCentres`: the ankle at the `leg.<s>` bottom end's x and z and height `0.0405 S` (`:303`-`:309`); the foot radius 0.6 times the `foot.<s>` girth at its middle station (`:311`-`:313`); `toe.<s>.<k>`, k 1 the hallux (`:314`-`:317`, `:344`), divided by `phalanges` with the web at the chain's last station and the tip at its pole (`:389`-`:411`, path `:394`-`:395`) in conventional units (`FINGER` `:373`, `HALLUX` `:376`); the midfoot at `lerp(ankle, ball, 0.4)` (`:325`).
- `AutoMovieHumanNail` takes toe chains by `^(finger|thumb|toe)\.(left|right)(?:\.(\w+))?$` (`:100`-`:101`) and anchors them on the `foot.<side>` prefix (`:229`); the Couplings list above omits it. `AutoMovieHumanSkinLandmarks` reads `foot.<side>` for the sole height and `toe.<side>.` for the tips (`:165`-`:177`); `AutoMovieHumanSkinTone` tints soles on `foot.`, `forefoot.` and `toe.` (`:286`-`:288`).

#### What the foot fitters read

No foot fitter reads the world-height calibration. `fitBodyBase.ts` (foot path) reads the leg family, the heads plane, the toe families and root files, and the joints (`:82`-`:95`, `:130`-`:132`, `:214`, `:250`-`:262`); `fitAppendage.ts` (toe path) reads the toe family, its root file and the joints (`:79`-`:85`); `fitStrip.ts` (toe strips) reads the foot and toe fits and the leg, heads and toe families (`:106`-`:110`, `:322`-`:338`); `planSitePlanes.ts` reads the identity (`:26`). `observeFootSections.ts` and `FootSectionGeometry.ts` (imported only by it, `:41`) serve only the retired calibration's `foot-sections-v1.json.gz`; `FootCorrespondence.ts` is imported by nothing.

#### Open defects and their causes

| Defect | Cause |
| --- | --- |
| Lesser toes shortened by the fit: the index, middle, ring and little toes would end up to 15.2 mm short of their tips | The straight `_01`-`_02` axis rises out of a toe whose distal phalanges flex down, so past the run the skin's highest crossing lies at most 2.1 mm above the plane's origin and distally below it, and `--around` drops the loop (`observeBodySections.ts:20`-`:23`); the little toe's planes end at one bone length past `_02` while its skin continues (`planBodySections.ts:122`-`:126`). `fitAppendage.ts:155`-`:170` then takes the pole and the cap end from the truncated run |
| The right index toe's run has a hole: plane 22 has no loop, plane 23 one | The same origin test: the axis re-enters the skin at plane 23. `fitAppendage.ts:307` keeps every plane from the root, and `loopOf` throws on a key at plane 22 (`:113`-`:116`) |
| Foot base keys can cross its end key inside the skin | `planeAt` searches to the ball plane (`fitBodyBase.ts:153`-`:158`), whose last four planes meet the heads plane inside their loops |
| The foot's distal closure is not the skin's | The cap pole is the area centroid of the middle toe's root loop (`fitBodyBase.ts:214`-`:215`), a point inside the toe, and the cap keys are scaled by `sin(theta)` (`:222`-`:236`) |
| Toe regions on the foot by the cell rule and a mask; toe strip trims by the same rule | `fitBodyBase.ts:276`-`:336`, `fitStrip.ts:123`-`:197` (the rows of the Shared fitting code table) |
| The foot's and toes' axes and phase origin come from the world, and their keys are stored in world coordinates | The planner takes each plane's u from world forward, or up where the plane faces forward (`planBodySections.ts:144`-`:148`); the fitters start a module's key axes from that u (`fitBodyBase.ts:184`, `fitAppendage.ts:244`-`:247`) and write key frames in the world (`IAutoMovieHumanFeatureChain.ts`, `IKey.frame`), so no module has a frame of its own that a transform could carry |
| Exported names miss every consumer: `bigtoe.left` against `toe.left.1` | `fitAppendage.ts:76` names a toe by its family; the consumers above name `toe.<side>.<k>` and read a toe's web at its last station |
| Left and right toe trees, events and poles differ on a mirror-symmetric body (world-height calibration, rendered today) | Each side's toe webs were split where its own cross-plane contacts were found by bisection to 0.01 mm (`observeFootSections.ts:198`-`:234`), so the split order follows each side's facets |
| Toe tips and webs depend on repairs (world-height calibration) | Fan poles at the toe tips replaced by `domeBase` domes and web rings low-passed by `AutoMovieHumanContactSmoothing`; repairs after the fit, retired with the rows |

### Leg

The numbers of this subsection were printed by these read-only scripts (outputs beside them):

```text
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/leg/legSurvey.ts test/.shots/f1 .shots/claude-scratch/leg/leg-survey.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/leg/legDetail.ts test/.shots/f1 .shots/claude-scratch/leg/leg-detail.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/leg/legFrames.ts test/.shots/f1 .shots/claude-scratch/leg/leg-frames.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/leg/legTrim.ts test/.shots/f1 .shots/claude-scratch/leg/leg-trim.txt
for s in 1 2; do awk -v S=$s 'BEGIN{split("0 45 90 135 165 180 195 210 225 240 255 270 315",az," ")} /^=== side/{side++} side==S && /^    plane/{for(i=3;i<=NF;i++){v=$i; sub(/\[.*/,"",v); v+=0; if(v>50) continue; k=i-2; if(!(k in mn)||v<mn[k]){mn[k]=v; mnp[k]=$2} if(!(k in mx)||v>mx[k]){mx[k]=v; mxp[k]=$2}}} END{for(k=1;k<=13;k++) printf "az %s: %.2f (%s) .. %.2f (%s)\n", az[k], mn[k], mnp[k], mx[k], mxp[k]}' .shots/claude-scratch/leg/leg-detail.txt; echo; done
awk '/^=== side/{side=$3} /^  [0-9]+ \(.*spans /{p=$1+0; s=$0; sub(/.*spans /,"",s); sub(/,.*/,"",s); if(p>=25 && p<=208 && s+0>m[side]){m[side]=s+0; at[side]=p}} END{for(k in m) print k, m[k], at[k]}' .shots/claude-scratch/leg/leg-survey.txt
```

The `awk` loop printed, to the terminal, each azimuth's least and greatest calibration-minus-observed radius over planes 24..40 per side from `leg-detail.txt`, leaving out the one cell above 50 mm (plane 24, azimuth 240, below). The last `awk` command printed, to the terminal, each side's largest span count over planes 25..208 and its plane from `leg-survey.txt`'s per-plane lines (`_r 90 28`, `_l 85 27`).

Positions are registered millimetres (x forward, y up, z left). An azimuth in a leg plane runs from the leg's front (0) through lateral (90) and back (180) to medial (270). Left and right agree to the printed digit unless a pair `left / right` is given.

#### Joints, family and frames

- Bind joints (`HumanBodySkeleton.read`): `thigh_l (25.4, 904.8, 96.6)`, `calf_l (16.3, 466.9, 117.1)`, `foot_l (1.2, 74.7, 134.4)`, `ball_l (133.1, 9.2, 157.2)`; femur 438.51 mm, shank 392.83 mm; the knee bends 1.03 degrees, the ankle 65.72. The four joints are coplanar: `ball` lies 0.090 mm off the plane through the other three. The knee's bend axis (femur x shank) and the ankle's (shank x foot bone, the Foot's `e3`) lie 0.04 degrees apart, and so does the third column of the bind affines of `thigh_<s>` and `calf_<s>`, registered as the positions are: the rig's hinge of the whole leg (`leg-frames.txt`). The affines' first column runs along the bone on the left and against it on the right (the rig's own convention per side). `HumanBodySkeleton.read` swaps the source's side suffixes on f1 (`HumanBodySkeleton.ts:40`-`:45`), so the source's `thigh_r` record is the calibration's `thigh_l`.
- The leg family (`leg_<s>-v2.json.gz`, axis `thigh`, `calf`, `foot`, `ball`, `planBodySections.ts:109`): planes every 4 mm counted from each joint (`:193`-`:196`). The knee plane, through `calf_<s>`, is index 110 at 438.5 mm of arc from the thigh joint; the ankle plane, through `foot_<s>`, index 209 at 831.3 mm, and plane 208 lies 0.8 mm before it. The planes turn from the femur to the shank over planes 96..123 (-54.5..52.0 mm about the knee plane) and toward the foot from plane 197 (44.8 mm before the ankle plane). Every plane 0..208 keeps one loop round its origin (`observeBodySections.ts:211`), and no loop reaches past its next plane (the largest reach is -0.22 mm, plane 208 against the ankle plane). The file's status is `partial`, with 371 / 370 diagnostics. Loops of planes 24..208 have up to 87 / 90 Hermite spans (plane 24 / plane 28), of planes 25..208 up to 85 / 90 (plane 27 / plane 28); planes 0..23 up to 149 / 148.
- Planes 0..23 hold one loop round both the bind axis's crossing (as `findRootKeys.ts:49`-`:55` continues it below the pelvis) and the other leg's bone polyline's crossing, 985.7 to 1198.5 / 1198.4 mm long: the pelvis with both thighs. Plane 24 is the first whose loop winds round neither, nor round either arm's bone polyline, the same plane as `leg_<s>-root-v2.json`'s index on both sides. The planner's in-plane u is world forward made normal to the plane (`planBodySections.ts:144`-`:148`).
- Front axes. The trunk's forward at the pelvis (the Trunk plan's rule: the natural spline's tangent through the spine joints, the hip axis) carried onto the femur by the least rotation from the trunk axis's downward direction lies 1.18 degrees from +x; carried by rotation-minimising transport over the family planes from plane 24 to the ankle plane, it meets the foot's ankle key axis (`u = e3 x n`, the Foot plan) 8.32 degrees off (`leg-detail.txt`). The front built from the ankle's bend axis (lateral `e3` made normal to the femur, front = lateral x along) lies 8.47 degrees from +x and meets the foot's ankle key axis 0.00 degrees off (`leg-frames.txt`): the leg's hinge plane, which holds all four joints, is turned out of the trunk's sagittal plane. The knee's bend axis is the same line but rests on a 1.03-degree bend.

#### Root loops and the crotch

- Root loop, plane 24 at 96.00 mm of arc: normal `(-0.021, -0.999, ±0.047)`, along the femur; 87 / 84 spans, 647.4 / 647.3 mm; heights 803.9 to 813.3 mm; 117.1 mm at most from the bone line ([experiments](experiments.md), Identity measurement: 117 to 126 mm for loops standing apart from the other femur, 308 to 310 mm on m1 and m2 for loops tested against the bind axis alone).
- The two root loops come within 2.67 mm of each other. Their medial-most points `(8.3, 804.6, 1.3)` / `(5.7, 804.6, -1.3)` lie 1.31 / 1.29 mm from the midline. The crotch, the Rise course's lowest point `(-0.3, 805.1, -0.0)`, carried along the root plane's normal lies outside both loops, 0.43 mm on the trunk's side of the root plane and 1.47 / 1.72 mm from the nearest root loop point.
- The trunk rows' points distal of the root plane within 150 mm of the femur line, 1024 / 1027 at 8 per span in the rows 807.1 to 813.1 mm, lie within median 1.25 / 1.19 mm and at most 2.50 / 2.86 mm of the leg family's loops from plane 24 on: the leg family observes that skin.
- The skin crosses the root plane's normal, the femur's direction, at a grazing angle over most of the root loop. From each root loop point to plane 25's loop along the loop's outward normal, the angle between that normal and the skin's tangent plane has median 4.54 / 4.93 degrees and quartiles 2.25 / 2.12 and 28.96 / 31.67 degrees, at most 53.64 / 54.16; 379 of 696 / 340 of 672 points lie under 5 degrees and 446 / 406 under 10 (`leg-trim.txt`). The steep part is the buttock's underside, behind and medially, where the radius falls up to about 1 mm per mm of station (The gluteal fold). Plane 25, 4.00 mm past the root plane, is the first family plane the whole root loop lies proximal of.
- Planes as keys: the line every plane 25..208 shares with the root plane, and every plane 26..208 with plane 25, and with the ankle plane misses the inside of both loops; the least clearance is 22.11 / 22.95 mm (plane 208 against the ankle plane), and the planes before the knee's turn are parallel to planes 24 and 25 (70 such pairs past plane 25). The root and ankle planes meet more than 1000 mm from both loops.

#### The heel's upper back and the ankle turn

- The loops of planes 193..208 lie wholly proximal of the ankle plane (plane 208 at most -0.22 mm past it), and the ankle plane's loop wholly distal of plane 208 (at least 0.22 mm past it): the family planes split the skin at the ankle plane without crossing it.
- The heel's upper back (mesh vertices below the ankle joint, behind it along the foot bone and proximal of the ankle plane, the Foot's 23 per side) is nearest planes 205..208 (3, 5, 8, 7 / 3, 5, 7, 8 vertices), within median 1.60 / 1.57 mm and at most 3.02 / 3.06 mm of the leg's planes before the ankle plane. The leg skin between plane 197 and the ankle plane, 182 vertices, lies within median 1.03 / 1.04 mm, 99th percentile 2.92 / 2.85 mm and at most 3.02 / 3.06 mm of them, the worst at `(-38.1, 62.3, ±135.9)`, 29.1 mm behind the ankle along the foot bone and 9.0 mm before the ankle plane; 22 / 21 lie beyond 2 mm.
- Thigh skin from the root plane to plane 96 within 150 mm of the bone line, 965 vertices, lies within median 1.12 / 1.10 mm, 99th percentile 2.60 / 2.85 mm and at most 3.56 / 5.40 mm of the leg's planes; 51 / 47 lie beyond 2 mm.

#### The gluteal fold

The radius of each loop from its plane's origin, along 24 azimuths, from plane 24 to plane 95 (`leg-survey.txt`). Behind and medially the radius falls about 0.9 mm per mm of station below the root plane, then turns flat within a few millimetres: at azimuth 240 from 108.5 mm (plane 24) to 90.0 mm (plane 29) and 88.5 mm (planes 31, 32); at azimuth 210 from 117.0 mm (plane 24) to 91.4 mm (plane 31) and 87.2 mm (plane 33). The largest positive second differences of the radius over station, the crease, run obliquely across the planes: azimuth 270 at plane 25 (0.163 / 0.178 mm per mm squared), 255 at plane 27 (0.156 / 0.137), 240 at plane 29 (0.167 / 0.169), 225 at plane 31 (0.109 / 0.117), 195 and 210 at planes 30 and 31 (0.072, 0.071), 180 at plane 26 (0.048); laterally behind (azimuths 120 to 150) at most 0.021. So the infragluteal fold lies on the leg, 4 to 28 mm distal of the root plane, deepest posteromedially, and the leg's first planes carry the underside of the buttock above it. Every ray from a plane's origin, every 5 degrees on planes 24..44, crosses its loop exactly once (1512 rays per side), so in the leg's planes the buttock's underside and the fold are a radial height field over the leg's axis, with no overhang. The observed loops of planes 24..95 change curvature sign 34 times (median; 23 / 21 to 43 / 47) over their posterior halves at 8 samples per span: the source's facet noise, which the Recovery fits follow.

#### World-height leg chains and their consumers

- `AutoMovieHumanTorsoCalibration`'s `leg.<s>`: basis spline, order 256, rule polar, samples 256; 19 / 20 horizontal layers at 103.79, 183.79, 273.79, 363.79, 403.79, 423.79, 453.79, 493.79, 513.79, 543.79, 633.79, 723.79, 763.79, (773.79 right only), 783.79, 793.79, 799.00, 801.00, 803.79 and 804.84 mm. Curvature sign changes per layer at 8N samples, whole loop / posterior half: 0 to 10 / 0 to 6 from 103.79 to 723.79 mm, 8 to 16 / 8 to 14 from 763.79 to 793.79 mm, then 22 / 17, 32 / 21 (30 / 19 right), 66 / 31 (69 / 35) and 68 / 32 (73 / 38) at 799.00, 801.00, 803.79 and 804.84 mm (`leg-detail.txt`).
- Events and trims (`world-chains.txt`, `foot-survey.txt`): `trunk` splits down into both legs at its bottom ring (804.87 mm), and each leg continues down into `foot.<s>`; the foot region trims the legs' bottoms at stations 113.5 / 112.5 mm, so the repaired chains run from 113.50 / 112.50 to 804.84 mm.
- The repaired calibration against the leg planes 24..40, along the horizontal ray from the femur line at the observed point's height, minus the observed radius: -0.25 to +0.64 mm at azimuths 0 to 180, 270 and 315; across the fold, azimuths 195 to 255, -1.11 to +1.08 mm on the left and -0.64 to +0.60 mm on the right. At azimuth 240 the left leg stands 1.05, 1.11 and 0.78 mm inside the observed skin at planes 31..33 and 0.95 to 1.08 mm outside at planes 37..40. At plane 24, azimuth 240, the observed point lies above the leg chain and the ray meets the far side of the `trunk` ring, so that cell measures nothing and is left out.
- Consumers of `leg.<s>`: `AutoMovieHumanJointCentres.ts:99`-`:106` (each hip centre interpolated at height `0.518 S` between the knee and the leg's top), `:302`-`:339` (the knee as the axis point at station `0.2865 S`, the ankle at the leg bottom's x and z and height `0.0405 S`, the radii as girths at mid-stations taken as heights). On the calibration they lie 26.0 mm (hip, 25.8 mm below `thigh_<s>`), 22.3 mm (knee, 19.3 mm above `calf_<s>`) and 6.0 mm (ankle, 6.0 mm below `foot_<s>`) from the bind joints (`leg-detail.txt`). `AutoMovieHumanGarmentBody.ts:295`-`:307` takes `leg.left` and `leg.right` parts as covered chain kinds, which the brief's leg openings read (`AutoMovieHumanGarmentPattern.ts:176`-`:177`). `AutoMovieHumanSkinTone.ts:277`-`:283` darkens a knee band on `leg.` chains about world height `0.285 S` (`AutoMovieHumanSkinLandmarks.ts:222`-`:223`) on the side facing world +x. `AutoMovieHumanSkinMarks.ts:343` weights freckles on `leg.` chains. `AutoMovieHumanBodyGirth.ts:85`-`:96` (thigh, knee and calf stations in fixed station windows) and the warp read the leg chains by name and layer; Retirement deletes them.

#### What the leg fitters read

No leg fitter reads the world-height calibration: `fitAppendage.ts` imports only the chain and frame types (`:38`-`:41`), `fitStrip.ts` only the `IAppendage` type of the calibration (`:40`).

- `fitAppendage.ts` (leg path): the family, its planes and `-root-v2.json` (`:83`-`:86`); the foot's fit, whose first key it copies as the held ankle key with `ends.top` (`:141`-`:148`, `:250`-`:252`, `:299`), checking that the foot's first key stands at the leg's own station of the ankle plane (`:147`); keys at the root, the joints the axis crosses and the identity's `thighGirth`, `calfGirth` and `ankleGirth` sites (`:50`-`:53`, `:202`-`:229`) by `keyStations` (`:230`-`:235`); key axes carried back from the foot's key (`:239`-`:243`); N 64, `CYCLES` 4, `CAP` 6 mm (`:46`-`:48`); observations from the root plane to the ankle plane (`:307`); the biweight with GCV (`:322`-`:327`); the chain name `leg.<side>` (`:76`).
- `fitStrip.ts` (leg path): the trunk fit's `radius` and `regions` (`:114`, `:340`-`:342`), the leg's `-root-v2` loop carried by the nearest-cell rule (`:120`-`:143`), a trim count raised until one cell (`:179`-`:197`), the saved loft and the trunk rows between the trunk's cap pole height and its last key's station as world heights, kept by a winding test about the bind axis polyline (`:284`-`:321`), the family's planes before the root (`:367`-`:377`), the reach by doubling and golden section (`:406`-`:436`), the row rule (`:446`), the biweight, two pairing rounds and GCV (`:500`-`:610`).
- `findRootKeys.ts` tests a leg loop only against the bind axis continued below the pelvis (`:49`-`:55`, `:111`-`:116`); `measureIdentity.ts` also tests the other femur (`:373`-`:396`, `:463`-`:466`).
- `exportModules.ts` reads `leg_<s>-base.json` and `leg_<s>-strip.json` (`:156`, `:160`, `:163`-`:178`).

#### Open defects and their causes

| Defect | Cause |
| --- | --- |
| Horizontal gluteal fold (the leg's share) | The `trunk` and the legs meet in a horizontal contact ring at 804.87 / 804.84 mm (Trunk), at the height of the tilted root loop (803.9 to 813.3 mm), while the observed fold runs obliquely 4 to 28 mm below the root plane, posteromedially; the leg's top layers bunch at 793.79, 799.00, 801.00, 803.79 and 804.84 mm and cannot follow an oblique crease; at azimuth 240 the left calibration stands up to 1.11 mm inside the crease and up to 1.08 mm outside below it (root causes 2 and 3) |
| Thigh line at the crotch ring | The same ring and the shape's fold there (Open defects); the leg's last four layers lie at 799.00, 801.00, 803.79 and 804.84 mm under it with 22 to 73 curvature sign changes each, and the event join and `ringBlend` act within 4 mm of it (root causes 3 and 4) |
| Vertical striations on the backs of the thighs (the leg's share) | `leg.<s>`'s 256-point layers from 763.79 mm up change curvature sign 8 to 73 times each, 8 to 38 times behind; the observed leg loops, Recovery fits of the same faceted source, change sign 34 times (median) over each posterior half, and each calibration layer was fitted to one row of such fits (Calibration data; root cause 1) |
| Root loops holding both thighs (m1, m2) | `findRootKeys.ts:111`-`:116` tests the bind axis only; on f1 the first plane apart from it, plane 24, also stands apart from the other leg's bone |
| Joint centres off the bind joints | `AutoMovieHumanJointCentres.ts:99`-`:106`, `:302`-`:339` take stature fractions as heights on the leg chain: hip 26.0 mm, knee 22.3 mm and ankle 6.0 mm from `thigh_<s>`, `calf_<s>` and `foot_<s>` |
| The leg's axes, phase and keys from the world | The planner's u is world forward (`planBodySections.ts:144`-`:148`); `fitAppendage.ts:239`-`:243` carries the key axes from the foot's key and writes them in the world; the knee band and its facing are world height and world +x (`AutoMovieHumanSkinTone.ts:277`-`:283`) |
| Keys at sites and joints; the foot's station tied to the leg's | `fitAppendage.ts:202`-`:235` puts keys at the girth sites and joints; `:147` requires the foot's first key at the leg's own station, which the Foot plan's stations from `foot_<s>` break |

### Integration

The numbers of this subsection were printed by these read-only commands (outputs beside them):

```text
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/integration/worldChains.ts .shots/claude-scratch/integration/world-chains.txt
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/integration/buildCost.ts .shots/claude-scratch/integration/build-cost.txt
gh run view 40509399129 --json jobs --jq '...' > .shots/claude-scratch/integration/ci-build-40509399129-jobs.json
gh run view 40509399129 --log > .shots/claude-scratch/integration/ci-build-40509399129.log
node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/integration/jointNames.ts test/.shots/f1 .shots/claude-scratch/integration/joint-names.txt
```

File and line citations below were found by searches (`grep -n` over `packages/human/src` and `packages/playground/src`) and checked against the cited lines; the files read whole are listed in the plan's Integration self-review records.

#### Consumers of world-height chain names and part ids

The world-height calibration has 51 chains, 25 events, 27 critical poles, 4 apertures without `base` (`nostril.left` pocket 8.96 mm, `nostril.right` 8.68 mm, `eye.left`, `eye.right`), 2 eyes and no appendage (world-chains.txt). Every chain but the feet's and `head.lower` lies in horizontal sections, so its station is a world height: `arm.<s>` runs 957.61 to 1276.57 mm and every digit hangs in horizontal sections. The module chains break three assumptions the consumers make: that a station is a height, that a limb or digit runs from its distal end (bottom) to its proximal end (top), and that a tip is a `calibration.poles` entry. A module chain's station is arc length along its axis, a limb or digit runs from its first key, past its root, to its distal end, and a cap's pole is the composed chain's own `pole`.

| Consumer | Reads | Needs from the modules |
| --- | --- | --- |
| `skeleton/AutoMovieHumanJointCentres.ts:95`-`:137` | `trunk`, `upper`, `head` by name; the hip, lumbar and thoracic joints as axis points of `trunk` at stature fractions taken as stations; the neck base at `upper`'s top; the neck radius from `head`'s middle; the chest radius at `trunk`'s top, the axilla | `trunk` alone (it spans what `trunk`, `upper` and the bottom of `head` spanned, Trunk); its top is the neck ring, not the axilla, so the chest radius needs a station of its own; the neck radius from the head base's first key, which the trunk owns |
| `AutoMovieHumanJointCentres.ts:117`-`:130` | `ear.lobe.<s>` bottom ends for the occiput; the `head.upper` crown from `calibration.poles`; the head radius at `head.middle`'s first layer | an occiput that reads no lobe chain, since the Head's auricles are `ear.left` and `ear.right` with no `ear.lobe` chain (Head); the crown from the head base's cap `pole` |
| `AutoMovieHumanJointCentres.ts:169`-`:300` | `arm.<s>` with the wrist at its bottom and the shoulder at its top; `hand.<s>.1`; `thumb.<s>` and `finger.<s>.<k>` with the web at the last station and the tip in `calibration.poles`; the glenohumeral and sternoclavicular points from `upper`'s ring at `min(0.8 S, top)` | the arm's proximal end from its `appendages` entry (rooted end) and its distal end from the shared wrist key (`ends.top`, owner `hand.<side>.palm`); the palm `hand.<side>.palm`; each digit's joints from its bind joints, since its chain starts at its first key past the root, not at the web, and its tip at its cap `pole`; the shoulder points, which the rule takes from a ring at a height, a height no station of the module `trunk` is |
| `AutoMovieHumanJointCentres.ts:302`-`:362` | `leg.<s>` with the knee as the axis point at station `0.2865 S`, the hip from its top, the ankle from its bottom's x and z; `foot.<s>`; `toe.<s>.<k>` as digits | the knee, which the rule places at an axis height of `0.2865 S`, a height no leg station is (the leg's station is arc length); the hip end from the leg's `appendages` entry, the ankle end from its shared key with `foot.<side>`; the toes as the digits |
| `generation/AutoMovieHumanBodyGirth.ts:78`-`:96`, `AutoMovieHumanBodyLandmarks.ts:96`-`:174`, `AutoMovieHumanBodyWarpField.ts:162`-`:604`, `AutoMovieHumanBodyWarp.ts:96`-`:279`, `calibration/AutoMovieHumanBodyMorphCalibration.ts` | chain names and layer indices of the law and the basis | nothing: Retirement step 3 deletes them; `AutoMovieHumanBodyTree.ts` and `AutoMovieHumanStretchProfile.ts` are imported only by the warp field (`AutoMovieHumanBodyWarpField.ts:8`-`:9`), and `AutoMovieHumanBodySpecimenCalibration` only by the law (`AutoMovieHumanBodyLaw.ts:13`) |
| `appearance/AutoMovieHumanGarmentBody.ts:295`-`:307`, `:322`-`:345` | parts of `trunk`, `upper`, `leg.left`, `leg.right`; the crotch as `trunk`'s lowest vertex and the axilla as its highest | `trunk` and `leg.<side>`; the crotch stays the trunk's lowest point (its cap pole is the crotch, Trunk); the axilla is no longer the trunk's top, which is the neck ring |
| `appearance/AutoMovieHumanSkinChart.ts:251`-`:275` | `head`, `head.*`, `upper`, `trunk` share vertical charts; `bandOf` reads the part suffix as a number | the head base `head` (Head; no `head.*` chain remains) and `trunk`; a numeric suffix on every skin part (strip faults below) |
| `appearance/AutoMovieHumanSkinLandmarks.ts:106`-`:110`, `:133`-`:141`, `:165`-`:177`, `:188`-`:196`, `:253`-`:269` | `hand.<side>.`, `thumb.<side>`, `finger.<side>.`, `arm.<side>`, `foot.<side>`, `toe.<side>.`, `ear.*.<side>`; first and last band centroids | the Hand and Foot names match; ears by the Head's names; numeric bands |
| `appearance/AutoMovieHumanSkinTone.ts:216`-`:233`, `:262`, `:277`, `:285`-`:288` | `head`, `head.`, `ear.`, `hand.`, `finger.`, `thumb.`, `arm.`, `leg.`, `foot.`, `forefoot.`, `toe.` prefixes | the same prefixes; `forefoot.` names no module |
| `appearance/AutoMovieHumanFaceTone.ts:82`-`:83` | head family chains for the midline profile | the head base `head` (Head) |
| `appearance/AutoMovieHumanSkinMarks.ts:329`-`:358`, `:397` | `head`, `ear.`, `upper`, `trunk`, `arm.`, `hand.`, `finger.`, `thumb.`, `leg.` weights | `upper` names no module; `trunk`'s split at 0.7 stature is a world height |
| `appearance/AutoMovieHumanNail.ts:100`-`:101`, `:228`-`:229`, `:249`-`:252`, `:309`-`:325` | digit chains by `^(finger|thumb|toe)\.(left|right)(?:\.(\w+))?$`, anchors `hand.<side>.` and `foot.<side>`; first and last band centroids | the Hand and Foot names match; numeric bands |
| `appearance/AutoMovieHumanHeadField.ts:127`-`:129`; through it `AutoMovieHumanShoulderField.ts:73`-`:74`, `AutoMovieHumanBrowProjector.ts:40`, the hair guides and cards; `IAutoMovieHumanAppearanceBody.ts:26`-`:27` | `^human\.skin\.(head|ear)(\.[^/]+)?\/` | the head base `head` and the auricles `ear.left` and `ear.right` (Head), which the pattern matches as it stands |
| `playground/src/human/HumanCaptureCamera.ts:120`-`:135` | prefixes `human.skin.head/`, `human.skin.head.`, `human.skin.ear.` for the `head-*` close-ups | the same names (Head) |
| `playground/src/human/drawHumanCurveDiagram.ts:87`-`:148`, `drawHumanPageCurveDiagram.ts:33`-`:34` | every chain of the law's calibration by name, `<chain>/<k>` per layer | nothing by name: it lists the calibration it is given; the module faults below |
| `AutoMovieHuman.ts:122`, `calibration/AutoMovieHumanVermilionCalibration.ts:17` | the lip boundary's construction id `head.lower/mouth_vermilion` from the vermilion's `chain: "head.lower"` | the chain the boundary lies on in the head region (Head) |

The joint centres' stature fractions (0.518, 0.3425 with 0.245 and 0.617, 0.2865, 0.0405, and the jaw's 0.006, 0.008, 0.068) are all listed in `docs/anatomy/joint-range.md:76`-`:90`, which the module comment names for the rules (`AutoMovieHumanJointCentres.ts:16`-`:17`); the comment names `docs/anatomy/skeleton.md` as the fractions' source (`:11`-`:13`), whose text holds only 0.245 and 0.617 (`:103`, search).

The bind skeleton of f1's `body-observations.json` has 342 joints, each with its bind affine (`bindNativeAffineColumnMajor16`) and translation (joint-names.txt). Among them are `pelvis`, `spine_01` to `spine_05`, `neck_01`, `neck_02`, `head`, `clavicle_<s>`, `upperarm_<s>`, `lowerarm_<s>`, `hand_<s>`, each digit's metacarpal and `_01` to `_03`, `thigh_<s>`, `calf_<s>`, `foot_<s>`, `ball_<s>` and each toe's `_01` and `_02`, with corrective and twist joints; no joint name holds `jaw` or `eye` (search of joint-names.txt). The fitters read it (`HumanBodySkeleton.read`) and plant their family planes and joint planes on it; no generator consumer reads it, so the joint centres and the appearance fields anchor at stature fractions taken as world heights and at world axes: `AutoMovieHumanJointCentres.ts:98`-`:113`, `:154`-`:158`, `:175`, `:304`-`:310`; `AutoMovieHumanSkinLandmarks.ts:174`, `:222`-`:223`; `AutoMovieHumanSkinMarks.ts:332`, `:335`, `:355`-`:357`; `AutoMovieHumanSkinTone.ts:227`, `:266`-`:268`, `:279`-`:280`, `:292`; `AutoMovieHumanFaceTone.ts:74`-`:115`; `AutoMovieHumanGarmentBody.ts:333`-`:346`; `AutoMovieHumanSkinChart.ts:284`-`:345`; `AutoMovieHumanNail.ts:247`; `AutoMovieHumanHeadField.ts:77`-`:99`.

#### `exportModules.ts`

It reads `.shots/claude-scratch/<module>-base.json` and `<module>-strip.json`, `head-base-cap.json`, `head-reliefs.json` and `trunk-reliefs.json` (`:106`-`:108`, `:150`, `:159`) and writes four regions (`:144`-`:179`), each `{name, chains: [], networks, appendages, events: [], poles: [], trims: []}` (`:134`-`:142`): `AutoMovieHumanHeadModules` (one chain with the nose and lips reliefs), `AutoMovieHumanTrunkModules` (the trunk with its reliefs and the four limb strips), `AutoMovieHumanArmModules` and `AutoMovieHumanLegModules` (`palm` or `foot`, limb and five digits per side, and the digits' strips). Lengths round to 0.001 mm and unitless values to 1e-6 (`:39`-`:40`); stations of a root are lengths and phases unitless (`:93`-`:99`); an unknown field stops it (`:43`-`:45`); it prints each region's size and their total against "4865 KB" (`:130`, `:180`). It copies `samples` from the fit (`:73`), writes no stature, apertures, eyes or distance, and runs nothing of the generator on what it writes, so a shared key of another control count or an owner missing from the regions surfaces only in the generator (`AutoMovieHumanFeatureChain.ts:94`-`:96`, `:225`-`:228`). It reads the trunk reliefs as a bare array (`:159`), which the Trunk plan changes to an object.

The plan's Module data format adds: each chain's `anchor`, with its keys, pole and relief axes stored in the anchor's frame (Module frames and handles); the trunk region's `stature` (f1's applied height, `packages/playground/src/human-parameters/f1.ts`), the head region's `apertures` and `eyes`, which the Head plan places there in child frames of the head base's anchor, each fit's `distance` read and required (Files), and `samples` from the render.

#### Render path for a module calibration

`AutoMovieHuman.generate` (`AutoMovieHuman.ts:64`-`:214`) takes `AutoMovieHumanBodyLaw.calibrate(params).body`, scales by `height / calibration.stature`, lofts with `AutoMovieHumanBodySurface.generate` and a detail box 3 mm round the lips, splits by group, draws `AutoMovieHumanBodyConstruction`, dresses with `AutoMovieHumanSkin` and places `AutoMovieHumanAppearance`.

- `AutoMovieHumanBodyRegions.merge` (`:30`-`:102`) expands each network alone (`:45`, the survey's generator gap); Method's plan changes it to one `compose` and continuation events for shared ends.
- `AutoMovieHumanBodySurface` (`:393`-`:511`): appendage root loops and based apertures become `context.roots` (`:438`-`:467`); events give own and inherited rings (`:519`-`:548`); `loft` (`:559`-`:660`) bisects stations to the 0.5 mm chord `TOLERANCE` (`:83`), refines near openings and the detail box, slices the cap's pole key off and fans it to `target.pole` (`:589`-`:594`, `:1123`-`:1194`), leaves cells inside root loops out (`:667`-`:719`); `join` (`:726`-`:754`) builds each strip; `open` (`:761`-`:808`) closes based apertures with lids or pockets; other apertures are clipped by position (`:487`). Shading normals take the jet normal where a chain carries jets, but keep the mesh normal when it differs by more than 30 degrees (`:120`-`:131`), and `ringBlend` then averages normals 16 passes within 4 mm of every event ring (`:190`-`:301`), which continuation events would trigger at every shared key. A chain end with no event or root closes at a pole; a critical calibration pole gets the 4-ring dome over `domeBase` (`:1144`-`:1186`, `:1211`-`:1276`); a cap pole has no calibration entry, so it gets the flat fan. Inherited ring phases come from a 1024-sample nearest-point scan of the child's own section with a 1e-6 monotone floor (`:972`-`:1050`), although a shared key's section is the owner's own control points.
- Strip groups are named `<appendage>/root` (`AutoMovieHumanBodySurface.ts:741`). Every consumer that parses the suffix as a number gets `NaN`: `AutoMovieHumanSkinChart.ts:261`-`:263` sorts bands with a `NaN` comparator (`:355`-`:360`) and locates the strip against band 0; `AutoMovieHumanSkinLandmarks.ts:256`-`:264` and `AutoMovieHumanNail.ts:312`-`:320` take first and last bands from that sort. Strip interior vertices have `NaN` loft coordinates (`AutoMovieHumanBodyRoots.ts:172`-`:174`).
- `AutoMovieHumanBodyStrip` reads exact jets where a chain carries them and falls back to differences over 0.05 mm (`:167`-`:191`, `:272`-`:289`, `:304`); interior rows take the ring tangent by a difference of 1e-4 rad (`:96`-`:98`). `AutoMovieHumanBodyRoots` takes the base's outward normal by differences over 0.05 mm and 1e-3 rad (`:306`-`:321`); `trim` projects an aperture outline onto its base by a coarse search over ±8 mm at 512 phases with a 1e-3 forward bias, then up to 30 Newton steps with Jacobians by 0.01 mm and 1e-4 rad differences, steps bounded to 1 mm, stopping at 1e-4 (`:205`-`:260`). `AutoMovieHumanBodyApertures.cut` drops clipped islands under 64 triangles (`:429`-`:482`), and `refine` and `detail` split stations to 0.5 mm where rings pass within 2 mm of an outline or through a detail box (`:34`, `:37`, `:121`-`:198`), in station only.
- `AutoMovieHumanBodyConstruction` (`:71`-`:122`) draws every layer as `<chain>/<k>`, the axis and 8 to 32 guides per chain, plus aperture paths. It draws no relief, root loop, trim or strip edge, so the overlay and construction passes cannot trace a relief, a strip or a trim; with composed chains the layers are the keys.
- Skin and appearance read part ids (Consumers above) and `calibration.eyes`, `apertures`, `stature`. Ring phase counts come from each chain's `samples` (`AutoMovieHumanBodySurface.ts:932`-`:961`); the fitters write `2N`.

When the world-height chains vanish: the joint centres throw on the first missing chain (`AutoMovieHumanJointCentres.ts:59`-`:60`), so `AutoMovieHumanSkeleton.generate` and the stickman page fail; the garment returns null without a `trunk` part (`AutoMovieHumanGarmentBody.ts:242`) and with one measures the axilla at the neck; the face tone, ear flush, hand, elbow, sole and nail rules find no chain where the names differ and skip silently; the `head-*` cameras throw without head or ear parts (`HumanCaptureCamera.ts:128`-`:129`); the shape law throws in `displace` for f2, m1 and m2 (`AutoMovieHumanBodyLaw.ts:136`-`:141`).

#### Viewer and capture path

Read from code: `createHumanImagePlugin.ts`, `HumanImageSession.ts`, `HumanImageSourceIdentity.ts`, `humanImageProcessEntry.ts` (searched), `HumanCaptureCamera.ts`, `HumanViewerModel.ts`, `mountHumanViewerPage.ts`, `layoutHumanViewerPage.ts`, `resolveHumanCurves.ts`, `drawHumanCurveDiagram.ts`, `drawHumanPageCurveDiagram.ts`, `createHumanPartStyle.ts`, `human-images.json`.

- Routes: `/human-images/<alias>/<camera>.<pass>.png` for the cameras of `HumanCaptureCamera.names` (route pattern repeated at `createHumanImagePlugin.ts:257`), `/human-images/<alias>.model.json`, `/human-curves/<alias>[/<id>].png|svg`, `/human-parameters/<alias>.json`. The registry maps f1, f2, m1, m2 to `src/human-parameters/*.ts`.
- Headers: `cache-control: no-store`, `x-human-captured-utc`, `x-human-fresh-nonce`, `x-human-identity`, `x-human-png-sha256` (or `-svg-sha256`), `x-human-cache` `new-requested-frame` or `existing-png`, `x-human-binding`, `x-human-curves`, `x-human-view` (`:87`-`:103`, `:388`-`:436`). A frame slot is name, curves and view; a nonce equal to the stored one returns `existing-png` (`HumanImageSession.ts:101`-`:117`).
- Identity: the model key hashes the sorted `.ts` and `.json` bytes of five package `src` trees and the Human page modules (`HumanImageSourceIdentity.ts:53`-`:106`), 6,010,912 bytes of them in `packages/human/src`; a changed key reloads the worker's tab (`humanImageProcessEntry.ts:140`-`:144`). The worker launches Chrome with `--use-angle=d3d11` and refuses a software renderer (`:72`-`:78`, `:279`).
- Known faults:
  - `verification.md` step 3 says a click in `overlay` finds a skin interval; `HumanViewerModel.pick` (`:298`-`:337`) returns only construction curves, so a ripple between curves is found only by clicking a curve near it.
  - Reliefs, strips and trims have no construction curve (above), so they cannot be selected, isolated or framed by `fit=selection`.
  - The curve diagram draws the base section in its plane (`drawHumanCurveDiagram.ts:322`-`:347`, `AutoMovieHumanLoftChain.section`), without reliefs, so a section through the nose or a breast shows the base; its curvature takes the second derivative by a 1e-4 rad difference of the first, although `AutoMovieHumanLoftJet.at` gives it exactly.
  - `material=clay` applies to `human.skin.` parts only (`createHumanPartStyle.ts:127`), so `human.cavity.` pockets keep their colour in clay frames.
  - The source inventory hashes `.ts` and `.json` only (`HumanImageSourceIdentity.ts:66`); a `.js` emitted beside a source changes what Vite serves without changing the key (the 2026-10-25 incident of the project memory).
  - Diagram cache hits report `existing-png` also for SVG (`createHumanImagePlugin.ts:98`-`:101`).
  - The host identity hashes the image-service sources themselves (`HumanImageSourceIdentity.ts:27`-`:40`, `:109`-`:118`); after an edit to one of them a running service answers every image request with 503 "operator restart required" (`HumanImageSession.ts:103`-`:105`, `createHumanImagePlugin.ts:439`-`:451`).
  - The page generates in the browser (`mountHumanViewerPage.ts:290`-`:294`), so Vite serves the 2,471,951-byte one-line torso literal to every page load.

#### Build cost

CI run 40509399129 (this branch, 2026-10-27): the `pnpm run build` step took 13:08:45 to 13:40:26; `packages/human build` (`ttsc --noEmit && rimraf lib && ttsc && ttsc -p tsconfig.browser.json`, three compilations, `packages/human/package.json`) ran 13:09:02.53 to 13:39:44.49, 30 min 42 s, and `recovery`, `render` and `playground` started only after it; every other package finished by 13:09:25.84 (ci-build-40509399129.log, lines 270 to 298). `packages/human/src` holds 210 files, 6,010,912 bytes; the four literals Retirement deletes hold 4,968,079 bytes (82.7 %) in 108 lines, `AutoMovieHumanTorsoCalibration.ts` 154,497 bytes per line; twelve code files the plan deletes (Retirement's eleven and `AutoMovieHumanBodyTree.ts`; `AutoMovieHumanStretchProfile.ts` is not counted) hold 121,138 bytes; 921,695 bytes remain before the module literals are added (build-cost.txt). How the 30 min split between type checking, the lint plugin and emission was not measured; the CI run of the step 3 commit measures the change.
