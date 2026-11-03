# Modeler log

## 2026-11-04 batch, worker 3 (from 06:25, Get-Date)

State: the 06:20 plan is being built in the tree; nothing judged yet. Stale test runs of the previous worker (started 05:07 and 06:05, on the old tree) were stopped at 06:27.

Reading that corrects the 06:20 entry: `levels_isolation` (run 06:24:40 to 06:26:58, f1) does not list the arm law, which carries no level mark. Its two findings were `appearance/AutoMovieHumanSkinLandmarks.ts -> AutoMovieHumanSkinChart` (level 1 to 7) and `generation/AutoMovieHumanHeadLandmarks.ts -> AutoMovieHumanHeadVault` (level 1 to 2).

| Step | Done (06:28 to 06:35) |
| --- | --- |
| Isolation | `AutoMovieHumanSkinLandmarks` renamed `AutoMovieHumanSkinChartSites` (it measures the skin chart, level 7). The vault exponent leaves the level-1 layout: the layout carries the head tape (`IAutoMovieHumanHeadLayout.tape`), and the composer `AutoMovieHumanHeadPass.build` solves `plan.vault` by `AutoMovieHumanHeadVault.closing` on the cranium's back outline. |
| 1. Limb root strip | `generation/AutoMovieHumanLimbRootStrip.ts`: each column the quintic Hermite from the trunk's published jet (point, first and second derivative per mm of its station, read by one-sided third-order differences) to the limb law's own jet at its last own section, both scaled by the strip's run. Arm: `AutoMovieHumanArmScye` publishes the shoulders' jets and `under` (the ray crossing); `AutoMovieHumanArmLaw` composes the strip (run the mean chord, planes turned by the quintic smoothstep); `AutoMovieHumanArmRootStrip` deleted; the arm splits of the `upper` event are `shared` (new `ISplit.shared`, honoured by `AutoMovieHumanEventJoin`), so the join no longer re-slopes and refillets a strip already in the trunk's tangent plane. Leg: `AutoMovieHumanLegCrotchRoot` publishes the trunk's jets (rates and seconds) and `start` (within the event join's 6 mm taper of each pinch the jet turns to the slit's straight fall by the quintic smoothstep); the fillet is the depth-0 rounded ring only and carries the seconds; `AutoMovieHumanLegChain` composes the strip over the crotch reach; `AutoMovieHumanLegSection` reads it; `AutoMovieHumanLegCrotchSlope`, the hand-over weight and the fillet's growth with depth are deleted. |

| 2. Limb mass | `test_human_reference_limb_mass` (run 06:38:43, all four references) reads the front share by tenth of the segment, each person predicted by the other three within about 0.025: thigh 0.53 at a quarter from the hip, 0.58 to 0.59 at mid-thigh, 0.56 above the knee; shank 0.35 under the knee, 0.32 to 0.33 at the calf, 0.42 above the ankle. `leg/AutoMovieHumanLegMassPrior.ts` holds the four people's bin means (an aggregate population measurement, not a row of any reference) and the offset rule `front (ahead + behind) - ahead`; `AutoMovieHumanLegCentreLine` passes the forward offset through those centres where the law's own sections stand, with the ankle and crotch centroids and the knee's joint centre kept. The arm's twin is not read yet: the reading covers `leg_l` only. |
| 3. Breast | `AutoMovieHumanTrunkClosure.tapes`: a woman's wall at the bust row is the underbust tape (the thorax the fold closes, carried up; EN 13402-3 sizes a bra by the two girths), so the breasts' projection closes the whole chest excess. The men's ANSUR wall regression (`WALL_INTERCEPT`, `WALL_SLOPE`) is deleted; a man's chest tape still closes the wall whole. |
| 4. Head side sector | `AutoMovieHumanHeadSideSector`: the hand-over from the face's radius to the cranium's is the quintic smoothstep of the angle's share of the sector, G2 to both owners exactly, replacing the quintic Hermite on jets differenced over a sixteenth of the sector (`JET_SHARE`), the crease along Z in `head-left.png`. Open in this row: `AutoMovieHumanHeadRadius.sideWindow` sends the sector to the back midline when the eurion line stands within 4 `STEP` behind Z, a switch between sections; and the head chains' J3 joins. |

Type check of `packages/human` clean at 06:41 (`TTSC_LINT_DISABLE_CONFIG_CACHE=1`); the viewer's collector passed its 06:41:30 cycle. A first capture at 06:42 came from the page's 06:13 source (`keep=1` on the first shot reused it) and was deleted; the recapture loads the current source on its first shot.

The recapture stalled: from 06:43:17 the viewer's generation slot was held with no process computing; the capture was stopped at 06:54 and the 5231 viewer (started 04:26) restarted at 07:02 with its log in the session scratch folder. `test_human_universality` on f1 (06:55:53, 222 s) generated the figure with no thrown error and no diagnostic, and flung `arm.left` and `arm.right` layers 139 to 146 of 303 up to 727 mm past the standing box. Cause: the strip copied the shoulders' station derivative at its own speed, which grows without bound where the skin lies nearly in the ring's level plane, so `run · first` threw the columns out. Fix (07:01): each column's ends are reparametrized to the column's chord (`lambda = chord / |first|`, second derivative times `lambda^2`), which keeps the owner's tangent and curvature vector (G2) whatever its speed; the strip's `run` input is gone.

`test_human_universality` on f1 after the fix (07:04:09, 212 s): no flung chain, no diagnostic. Inspection frames `packages/human/.shots/worker-c4-20261104-0708/` (source `eadf776ded57`, one load, `hide=human.hair.*,human.garment.*`), read 07:12:

| Row | Phenomenon | Root cause | Same class elsewhere | Pieces, files |
| --- | --- | --- | --- | --- |
| R1 | A step round the face's sides from the temple to the jaw (`whole-left`) | Introduced by item 4: the quintic smoothstep blended the face's radius behind Z, where the face's super-ellipse is no skin (its back half falls to its centre). Hidden cause of the old crease along Z: the sector's jets were read by central differences straddling Z, so the face's jet read that back half | any jet read by central differences across an owner's boundary | `AutoMovieHumanHeadSideSector`; fixed 07:13: the quintic Hermite again, each owner's jet read by one-sided third-order differences inside its own owner |
| R2 | Breasts present (the chest excess now closes them) but conical (`whole-front`, `shoulder-front`) | The shared profile `(1 - rho^2)^3` has apex curvature `6 h / b^2`, three times a flat cap's; with the full projection it reads as a cone | the buttock uses the same profile | `AutoMovieHumanTrunkFeatureProfile.dome` (07:16): `(1 - rho^2)^3 (1 + a rho^2)`, `a = 3 - 1 / (1 + aspect^2)`, the apex of the spherical cap on the same base and height, C2 at the rim; `AutoMovieHumanBreastDome` reads it with the footprint's mean base radius |
| R3 | A cape over each shoulder: the shoulders' chain hangs as a sleeve from the glenohumeral height to the axilla, wider than the arm, ending in a blade where the arm's root strip turns in (front, back, `shoulder-front`, `neck-left`); present before the batch (`worker-c3-20261104-0613/neck-left.png`) | Traced so far: below the glenohumeral centre the shoulders' arc is a cylinder of the biceps radius about the abducted axis (`AutoMovieHumanArmRootOval`), the trunk's estimate of the arm; the arm's own tube at one scye radius below the axilla has its own girth law; the strip copies the sleeve's outward run and turns in over one chord | the arm's place has three estimates: the trunk's landmark (straight under the shoulder point), `AutoMovieHumanArmShoulder.glenohumeral` (read off the skin), the skeleton's elbow shift | numbers from `test_human_curve_arm` pending |
| R4 | A collar round the neck's base and rims at the band's ends (`whole-front`, `neck-left`) | item 5, open | | `AutoMovieHumanNeckConstruction`, `AutoMovieHumanHeadNeckBase.neckFade` (a fade seam in the registry) |
| R5 | A ring across both thigh tops under the buttocks (`whole-back`, `hip-back`), milder in curvature than before | pending the region tests (`step_groin`, `curve_leg`) | | the leg's root strip |
| R6 | Leg: the calf's mass behind the shin, the thigh's ahead (`thigh-left`) | item 2 reads correctly | | |

Region tests on f1 started 07:14 (22 tests in one run, the source before R2 and R3's fixes).

R3 traced (07:17 to 07:20): the shoulders' arm arc stands on the trunk's landmark glenohumeral centre (`AutoMovieHumanTrunkLandmarks.glenohumeral`, under the shoulder point), but the trunk dropped its landmarks after the solve and the body law never passed them to the skeleton (`AutoMovieHumanSkeletonLaw` has a `trunk` input no caller filled), so the skeleton and the arm stood on `AutoMovieHumanArmShoulder.glenohumeral`, read off the shoulders' skin as the lateral extreme less a radius: two owners of the arm's place, and the arm's tube hangs off the arc's axis. Fix: the trunk publishes its landmarks on the calibration (`IAutoMovieHumanBodyCalibration.trunk`, set by `AutoMovieHumanTrunkConstruction.apply`), the body law passes them to the skeleton, and `AutoMovieHumanArmConstruction` stands the arm on that centre (the skin read stays only for a calibration without a generated trunk). Type check clean 07:21.

Item 7, first two observers (07:25): `test_human_curves_plate_shoulder`'s made plate was centred 5 mm under and 15 mm lateral of the shoulder point with a fixed 6 mm lift, but the cap falls lateral of the point, so the made skin stayed under it (it read -0.64); its made lump sat at the outline's apex, where it only grew the one mass. The plate now stands on the highest skin 10 to 20 mm lateral of the point, lifted to top the point by 3 crease sagittas; the lump stands 0.06 S over the hip joint, where the outline has come forward, pushed to stand 3 crease sagittas behind the outline one lump radius under it. Not yet run.

Frames `worker-c4-20261104-0727` (source `34d634a3d495`, read 07:31): the one-sided sector jets drew fins at the brow and at the jaw's sides, since a fading face's tip read one-sided swings the span (the sixteenth-span central difference averaged it on purpose). `AutoMovieHumanHeadSideSector` is reverted to its committed form (07:31); R1's crease along Z stays open, with the face's back half as the traced cause of the straddling read and no construction yet that both reads the face only in front of Z and averages a fading tip. R3 after the shared glenohumeral centre: the arm's outer edge now continues the sleeve, and a lip remains at the sleeve's lower lateral corner. Cause: the scye ring is not level (its arm arc dips on the lateral side, the U in `neck-left`), but the arm's own sections started one scye radius under the ring's mean height, so on the lateral side the first own section stood above the ring and the strip column folded back up. Fix (07:33): the own sections start one scye radius down the walk from where it crosses the ring's lowest point. R4 (neck, item 5) traced in `neck-front`: a ledge where the head's lowest sections, tilted planes about the head's own centre, meet the band's level top ring, besides bands along the 21 mm band.

## 2026-11-04 supervisor audit 04:42, items answered (04:43 to 05:23)

| Item | What changed |
| --- | --- |
| 1. Fixing before the analysis was complete | The neck, buttock and knee edits stay uncommitted as part of one batch; the remaining rows are being settled from the reference sections (below, 05:20) before the batch is judged. |
| 2. Brief order | Step 1's survey is now a formal test, `test/src/features/human/levels/test_human_levels_structure.ts` (`HumanLevelStructure`): forward-only files, one short constant files, twins of masked code and module state kept by a test. Its 46 first findings are cleared: the hairline nape twins merged into `AutoMovieHumanHairlineNape`; the four skin-keyed and two mesh-keyed memo helpers (`HumanNeckReadingSingleton`, `HumanTrunkSitesSingleton`, `HumanHeadSitesSingleton`, `HumanVertexNormalsSingleton`, `HumanReferenceSurfaceGenerateds`, `HumanReferenceSurfaceReferences`) merged into `HumanSkinMemo`; the forwards `HumanInputResponseCache`, `HumanLayerBasisSingleton`, `HumanReferenceSurfaceLimitsSingleton` inlined at their callers; `HumanCurveRing.uniform` and `HumanPeople`'s table built per call; the seven helpers named `Singleton` that no longer cache renamed (`HumanReferenceBodies`, `HumanReferenceWeld`, `HumanReferenceRawOrder`, `HumanReferenceRig`, `HumanReferenceSkin`, `HumanReferenceCurveFile`, `HumanOralCavityParts`, `HumanHeadPiece`) and their docs, `reference-layer.md` and `consistency.md` corrected. The survey passed in the run started 05:09:47 (test log, 960 files). Kept open with reason: the library's own memos of person-independent images, the hand form and the spline's trig tables, and of person builds (`AutoMovieHumanArmConstruction.BUILT`, `AutoMovieHumanArmLaw.HULLS`, `AutoMovieHumanHandSkinTargets.TARGETS`), which the brief's rule (no test cache outlives its test) does not name; the finger shares (Greiner 1991's joint breadths could not be read: the DTIC scan answered 403, and no published digit depth is at hand); the priors' slider terms; the generation time. The owner's 04:59 order put the body first. |
| 3. Constants without a source | `AutoMovieHumanNeckConstruction.LEAST_RISE` is now `2 * AutoMovieHumanHeadNeckBase.NECK_STEP` with its derivation (the head reads one step under the neck's top and halves a shorter neck). The halfway seat is gone: the seat stands the least rise over the neck base course's highest landmark, never above the menton, read from the person's landmarks alone. Open: a published height of the neck girth's site (ISO 8559-1 5.3.2) against the cervicale or the menton. |
| 4. Type annotations | Every closure in the touched files annotated (`AutoMovieHumanNeckConstruction` `logs`, `size`, `top`, `length`; `AutoMovieHumanTrunkChains` `spacing`, `family`; `AutoMovieHumanTrunkSolver` `at`, `round`; `AutoMovieHumanBodyLaw` `free` and both `side`, with the `FootGiven` and `HandGiven` aliases). |
| 5. Second capture tool | `human-debug-owner.ts` deleted and its `tsconfig.debug.scripts.json` entry reverted; `human-debug-capture.ts` gained the timeout-free request, the gate wait, `keep=1`, the `new-requested-frame` check, `<person>-FAILED.txt` and `receipt.json`; the README documents it with the owner's twelve-shot command. The scripts tsconfig now lints with the shared config, as the debug tsconfig does, since the library's no-file-read rule had made the existing CLI fail to start. |

## 2026-11-04 supervisor decision 06:12, readings and batch plan (06:20, Get-Date)

Every row joins this batch. Readings since 06:12:

- Breast (C1-3): f1's trunk solve (`trunk.landmarks` piece, `packages/human/.shots/worker-c3-20261104-0613/receipt.json`) puts the fold at 1211 mm and the bust row at 1260 mm, the reference's own apex height, with the bust point 105 mm forward, short of the reference's front there. The breast stands at the right place and projects too little: the chest tape's excess over the wall regression is what the closure gives it, so the base takes the rest. Law for the batch: the base at the bust row is the thoracic wall the underbust tape closes (the fold's section carried up, ribs and pectoral), not a section closed to the wall regression's girth, and the breasts' projection closes the chest tape over it.
- Limb mass about the bone (C2-6): `test_human_reference_limb_mass` reads the four references' level `leg_l` sections against their own rigs (axes identified from the rig's joints, centimetres to millimetres, one origin; the bone stands inside every section). The section's front over its depth, measured from the bone, is a consistent prior by station share: thigh about 0.53 to 0.60, shank about 0.30 to 0.42 (mass behind the tibia, the anterior tibial border subcutaneous, Gray 1918), each person held out predicted within about 0.02. Law: the leg's sections are centred on the bone by this prior, in normalized coordinates, instead of on the bone itself; the arm's twin read the same way through the rig's arm joints.
- Head (C1-5): the curvature view (`head-left.png`) shows horizontal bands that follow the head chains' layers over the forehead and the brow, and a vertical crease from behind the eye down the jaw where the face's front half meets the side sector. Law: the head chains' joins copy the parent's station slope at the shared ring (J3), and the side sector's hand-over runs by the quintic smoothstep.
- Arm root on the strip: `neck-left.png` shows a crease along the scye ring where the strip leaves it; the strip's start tangent is the trunk's downward tangent, but the arm's top layer slopes are read by the chain's own differences across the ring. Law: the arm chain's top layer copies the strip's start jet.
- Neck band (C1-1) and the head's lower seam: rims at both ends of the band in `neck-left.png`; the band's rings are the prior's four rings 7 mm apart.
- The partial batch's region runs (f1, started 06:05 and 06:07, test logs): `leg_piece_bones` and `levels_structure` pass; `levels_isolation` fails because `AutoMovieHumanArmLaw` now imports `AutoMovieHumanArmRootStrip`, a seam-level piece (level 6) read by a lower level, so the strip belongs in the chain's composition (`AutoMovieHumanArmLayers`), not in the law; `plate_shoulder` reads the frontal half width widening 2.02 mm at 1268 on both sides, now symmetric (before: 1.22 and 1.96), its two proofs still not red; `step_shoulder` keeps the rims at 1393 to 1396 round both caps, where the shoulder cap meets the shoulder line, not at the arm root, so that row is C1-1's; `lump_buttock`, `rib_neck_front`, `step_neck_base`, `curve_arm` and `curve_hand` stay red (details in the runs).

Batch plan, in this order, every row in one batch, judged once:

1. The limb root strip moves to one shared module composed by the limb chains (arm and leg), its start jet copied by the chain's top layer; the leg's crotch hand-over (`AutoMovieHumanLegCrotchRoot`, slope carry, fillet) is replaced by it.
2. The leg's sections are centred by the limb mass prior above; the arm's twin read and applied the same way.
3. The breast: the bust row's base is the thoracic wall, the breasts close the chest tape.
4. The head chains' joins copy the parent's station slope (J3); the side sector's hand-over is quintic.
5. The neck band and the shoulder cap with level rows: the band's rings at the ISO 8559-1 neck base's own side height with the shoulder line arriving at its lateral jet, and the cap's fillet sharing the line's jet at the shoulder point.
6. The fingertip cap, the calf windows, the foot's malleolus layers and toe caps, each read in its curve view (`finger.png`, `calf.png`, `foot.png`, `toes.png` in `worker-c3-20261104-0613`).
7. The ten observers repaired so each made defect turns red.
8. Region tests, then the owner's twelve with `hide=human.garment.*`, one source.

Debt kept for after the batch, in the brief's order: the finger shares observed on f1, the priors' slider terms, the generation time, the unread anatomy fields (`sideNeckPointHeight`, `suprasternaleHeight`, `elbowBreadth`, `wristBreadth`, `kneeBreadth`, `ankleCircumference`, `bimalleolarBreadth`, `heelBreadth`, `ballOfFootLength`, `thumbBreadth`, `chestBreadth`), and the library's own memos.

## 2026-11-04 supervisor audit 06:10, answered (06:11, Get-Date)

The 06:03 batch is not judged. Every traced row is placed below either in the batch, with its law, or with the concrete unknown and the evidence that settles it, for the supervisor's decision.

| Row | Joins the batch with this law | Or: what is unknown, and the evidence that settles it |
| --- | --- | --- |
| C1-7 crotch seam | Yes: the same root strip rule as the arm (C2-3), the cubic Hermite from the trunk's crotch ring along the trunk's downward tangent to the leg's own bone-normal section along its tangent, replacing the hand-over and slope carry of `AutoMovieHumanLegCrotchRoot`; the strip moves to a shared limb module | |
| Observers (C2-5, three head proofs, shank, groin, patella window size) | Yes: each observer's made defect traced and repaired so it turns red | |
| Arm-root blade guard | Yes: `test_human_curves_plate_shoulder`'s frontal half width read the blade at 1270 (right, 1.96 mm); it guards once its made-plate proof turns red | |
| C1-3 breast | | Whether the chest's girth goes to the base by the closure's wall regression or by the fold and bust keys' fullness is not separated. Evidence: the solved state on f1 (bust and fold heights, projection, the wall girth), read on the `trunk.landmarks` piece |
| C2-6 limb mass about the bone, and its arm twin | | No published offset of the calf's and the thigh's mass centre from the tibia's and femur's axes is at hand; only f1 has bone-normal reference sections, so a reading cannot be generalized from held-out people. Evidence: a published cross-sectional anatomy of the leg, or the bone-normal sections of a second reference |
| C1-5 head chain seams | | `AutoMovieHumanEventJoin` already projects the child's slopes into the parent's tangent plane; the 8.5 degrees at 1542 stand where the skin lies nearly in the section plane (its documented guard). A J3 copy needs the child to share the parent's ring parametrization, which the separately fitted head chains do not. Evidence: the curve view of the head.middle and head.lower rings at 1542 |
| Forehead, temple, lip turns | | Which hand-over (cranium front, face, side sector, jaw) makes each turn is not read. Evidence: the head's curve views at the findings' points (37, 1582, 64), (49, 1596, 58), (67, 1618, 73), (23, 1477, 29) |
| Middle finger tip dome | | The tip cap's rule against the span shares is not read. Evidence: the hand's part view of `finger.left.middle`'s tip |
| Calf contour | | Whether the relief windows' declared heights or the base section sets the medial peak higher is not read. Evidence: the calf windows' heights against the composed contour |
| Foot malleolus ribs, toe caps | | Not traced. Evidence: the foot's curve view at layers 133 to 163 and 192, and the toe caps |
| Neck band rims (C1-1) with level rows | | The rims at the band's two ends are not separated between the trunk's top copy (J3, present), the band's own four prior rings 7 mm apart and the head's fade over the jaw. Evidence: the curve view of `head/<k>` at the band's ends |

## 2026-11-04 cycle 2 batch (in the tree at 06:03, Get-Date)

The leg tests added: the crotch seam folds 20.6 over 20 at its lateral side on both legs (`test_human_curve_leg`); the lateral calf contour peaks 2 mm below the medial (`test_human_curves_region_calf`); the shank and groin observers read f1 within their bounds, only their made-defect proofs fail; `test_human_leg_seam_reliefs` sizes the patella window from the leg piece's girth at a height where that girth is not positive, an observer defect (the windows are not wired into the chain).

| Row | Change |
| --- | --- |
| C2-1, C2-1b | The neck base course construction is disproved by the flanges it made and is reverted: the neck chain is again the prior's band under the head's seat at the cervicale, and the trunk's rows are level. The trunk's cervicale is now the person's own height (`IAutoMovieHumanTrunkInputs.cervicale`, ANSUR II), replacing the population share `AutoMovieHumanTrunkLandmarks.CERVICALE`. |
| C2-2 | The buttock key keeps its back place (`AutoMovieHumanTrunkKeys`). |
| C2-3 and the arm's mirror rows | The arm's own square sections end one scye radius down the walk from the level ring, and the root strip (`AutoMovieHumanArmRootStrip`) carries the skin to the trunk's ring: it leaves the ring along the trunk's own downward tangent (`AutoMovieHumanArmScye.down`, read on the shoulders' chain) and meets the arm in its tangent plane; its layer planes turn by the quintic smoothstep. The level fade (`REACH`) is gone, and the dead second layering (`AutoMovieHumanArmChain`) is deleted. |
| C2-4 | The knee stands on the hip-ankle chord (Neutral-0), with the sagittal row in `test_human_leg_piece_bones`. |

Left for the next cycle, each with its cause above: the breast's share of the chest tape (C1-3), the limb sections' mass about the bone (C2-6), the head chains' seam jets and the forehead, temple and lip turns (C1-5), the crotch seam (C1-7), the foot's malleolus ribs and toe caps, the middle finger's tip, the calf contour, the neck band's seams (C2-1's original rims), and the observers whose made defects do not turn red.

## 2026-11-04 supervisor audit 05:55, answered (05:56, Get-Date)

1. Orphan captures: no capture process of this session was alive and the viewer held no admitted request at 05:56; the stale owner folders `20261104-0430`, `20261104-0435` and `20261104-0445` (drawn without `hide=human.garment.*`, the second over two sources) are deleted. From now on one capture runs at a time, always with `hide=human.garment.*`, one stamp folder and one source per run.
2. Times: the debt commit's time is now git's (05:27:31); the log's other times are taken from git, the test logs, the capture receipts or `Get-Date`, and those without such a source are removed.
3. The head, arm, hand and foot rows: the region tests run on f1 now (hand webs and reliefs, hand and foot curves, malleoli; leg reliefs, curves, calf, groin, shank; head surfaces and seam), and their findings complete the table before the batch.

## 2026-11-04 supervisor audit 05:25 and owner orders 04:59, 05:27, answered

- Hourly commit: the structural-debt topic is `e8c766c` (05:27:31, git), pushed; the construction batch, the knee and the reference comparison stay out of it.
- Owner 04:59: every inspection frame from 05:26:53 (receipt, `worker-c2`) hides `human.garment.*` (and the hair where the region needs it); the owner set will be recaptured that way after the batch.
- Owner 05:27: the clock starts at the combined batch; the table below is completed first.

## 2026-11-04 cycle 2 analysis from the reference sections (written 05:47, Get-Date)

Evidence: `test_human_reference_sections` (f1, private pack, every reference section of the trunk and head, left leg, arm, hand and foot, generated extents at the same height; the run's numbers stay local), the batch's frames and close-ups under `packages/human/.shots/worker-c2/` (neck front and back, shoulder with sections, thigh back, chest left), and `test_human_universality` on f1: no diagnostic (run started 05:10:12, test log). The readings name directions and sizes only.

| Row | Phenomenon (reading) | Root cause | Same class elsewhere | Pieces, seams, files |
| --- | --- | --- | --- | --- |
| C2-1 | Two flanges round the neck: one where the shoulders' top rows meet the neck base course, one at the head's seat; the neck runs about 4 mm at its sides and back (close-ups) | The batch made the neck's bottom ring the non-planar neck base course and warped the trunk's top rows by a lift share, so rows of the shoulder ring are pulled down at the front while keeping their own width; the seat stands the least rise over the course, leaving the head's lower chain 11 mm to the menton | the trunk's rows are level by design; a non-planar boundary forces every neighbour to warp | `AutoMovieHumanNeckConstruction`, `AutoMovieHumanTrunkChains`, `AutoMovieHumanBodyLaw.neckLength` |
| C2-1b | Upper chest 12 to 17 mm short in front from 1274 to 1338, neck front 30 to 37 mm behind at 1414 to 1454 | Hidden by the same lift: the front points of rows near the neck carry the neck's receding front down over the upper chest; the neck's forward place and depth come from the prior fitted on the old 21 mm band (`AutoMovieHumanNeckPrior.place`, the top ring's depth over width), not on the neck girth's ring the top now is | the neck prior's sex terms regress on the removed slider | `AutoMovieHumanNeckPrior`, `AutoMovieHumanTrunkChains` |
| C1-3 | Chest front flat from 1154 to 1214 where the reference dips at its fold, and falling above, where the reference peaks at about 1254; a shallow bump above the areola in the side close-up | The breast's projection is the chest tape's excess over a man's wall regression, so most of the bust girth goes to the base; the base keeps its fullness down to the fold, which carries no recess | the fold row closes the underbust tape on the base alone | `AutoMovieHumanTrunkClosure.tapes`, `AutoMovieHumanTrunkKeys.heights`, `AutoMovieHumanBreastDome` |
| C2-2 | Buttock back within 3 mm of the reference from 900 to 960; one convex mass in the side and back frames | settled by the buttock key | | `AutoMovieHumanTrunkKeys` |
| C2-3 | Half width 40 to 49 mm past the reference from 1304 to 1338; a blade at each arm root (frames) | `AutoMovieHumanArmLaw.point` fades the tube onto the level ring over `REACH`; the root strip is never built | | `arm/AutoMovieHumanArmLaw.ts`, `arm/AutoMovieHumanArmLayers.ts`, `arm/AutoMovieHumanArmRootStrip.ts`, `arm/AutoMovieHumanArmChain.ts` |
| C1-7 | Hard ring across both thigh tops under the buttocks (back frame) | the groin seam is two fits and a fade (`seam-registry.md`) | | `leg/AutoMovieHumanLegCrotchRoot.ts`, `LegCrotchSlope`, `LegCrotchFillet` |
| C2-6 | Shank sections about 20 mm ahead of the reference with the calf's back 18 to 22 mm short (284 to 374); mid-thigh about 15 mm behind with the front 16 to 18 mm short (554 to 704); the crotch's thigh front 22 mm short | the leg's sections are centred on the bone's line, where the calf's mass stands behind the tibia and the quadriceps in front of the femur | the arm's flexors and extensors | `leg/AutoMovieHumanLegSectionLaw.ts`, `leg/AutoMovieHumanLegTube.ts`, `AutoMovieHumanLegPrior` |
| C1-5 | Jaw and mouth levels narrow at the sides (1484 to 1540), nape behind, nasal bridge level short in front (1590 to 1600), crown smaller all round (1664 to 1694); `test_human_head_seam`: the normals break 8.5 degrees across the head.middle to head.lower seam at 1542 in front and 1.0 degree across head.middle to head.upper at 1590; `test_human_head_surface_*`: a 2.2 mm dent and a 1.6 mm ridge on the paramedian forehead, temple profiles turning up to 2.7 mm, a 2.3 mm groove under the lower lip; three of their made-defect proofs do not turn red | The head's chains meet at their events with their positions only: no chain copies its neighbour's station slope at the shared ring (rule J3), so every head seam is a crease; the forehead and temple turns sit where the cranium's front, the face and the side sector hand over (`generalization.md`, Neck and head) | the trunk's top row copies the neck's jets (`AutoMovieHumanTrunkNeckSeat.layer`), the head's chains do not | `AutoMovieHumanEventJoin`, head chains and pieces, `AutoMovieHumanHeadSideSector` |
| Belly | Generated front within 8 mm of the reference from 974 to 1074 | no defect read | | |
| Arm | `test_human_curve_hand` and `curve_foot`: the left arm's layers 144 to 155 are not the right's mirror (up to 2.3 mm), the arm's top, the fade region of C2-3 | C2-3 | | as C2-3 |
| Hand | the middle finger's tip dome 16.2 to 16.7 over 15 on both hands | the finger's tip cap rounds wider than its own section allows (the f1-observed span shares, `AutoMovieHumanDigitSpan`) | | `hand/AutoMovieHumanDigitSpan.ts`, the tip cap |
| Foot | ribs of 258 to 801 over 250 on both feet at foot layers 133 to 163 and 192, near the lateral malleolus; every toe's tip mesh crumpled (75 to 107 points) | to trace in the foot's curve view (layers at the malleolus relief window, the toe caps) | | `foot/*Malleolus*`, `foot/AutoMovieHumanFootToeCap.ts` |

## 2026-11-04 reference sections against the batch, first reading

`test_human_reference_trunk_sections` (a reference comparison file no real test imports) cut f1's generated bind skin at each of the private pack's trunk and head sections; the numbers stay in the run, the readings below are what they show.

| Height | Reading | Row |
| --- | --- | --- |
| 900 to 960 | generated back within 3 mm of the reference | C2-2 settled by the buttock key |
| 1234 to 1284 | the reference front rises to its breast at about 1254; the generated falls from its abdomen, 12 to 17 mm short | C1-3: no breast stands at the bust |
| 1304 to 1338 | generated half width 40 to 49 mm past the reference | C2-3: the arm root's level ring |
| 1414 to 1454 | generated neck front 30 to 37 mm behind the reference, girth 248 against 362 at 1454 | new: the neck's forward place and depth |
| 1474 | the generated chin stands about 15 mm lower | head seat |

## 2026-11-04 cycle 2 (inspection 04:20 to 04:41)

Start: the three work documents were found in the Recycle Bin at 04:20 (moved there at 04:20 with `session-brief.md`) and restored to `docs/work/`. `packages/human` type-checked clean (04:22). Viewer on port 5231, compile collector and logs in the session scratch folder.

Evidence: the twelve red F1 tests run on f1 alone (`AUTOMOVIE_HUMAN_PEOPLE=f1 pnpm test --include ...`, 04:27 to 04:42), and the first owner frames of f1 and f2 (their folders deleted at 05:56: drawn with the underwear shown and over two sources).

| Test | f1 reading (baseline) |
| --- | --- |
| `plate_shoulder` | frontal half width widens above the deltoid at 1362 (left, 1.22 mm) and 1270 (right, 1.96 mm); buttock side outline rises 9.01 mm behind its forward run at 928; both made-defect proofs fail (the made plate reads -0.64, the made lump does not move the reading) |
| `rib_neck_front` | rims of 1.2 to 3.9 mm at 1458 to 1464 mm over all nine anterior azimuths |
| `step_neck_base` | rims of 3.8 mm at 1465 mm (azimuths 60, 300) and grooves of 1.4 to 2.1 mm at 1434 to 1438 mm all round the back; the made-ring proof reads below the unedited skin |
| `step_shoulder` | rims of 1.1 to 3.4 mm at 1393 to 1396 mm round both caps; the right side's made-ring proof rises 1.46 mm, under the 1.5 required |
| `dent_hip`, `fold_lean`, `dent_forehead`, `dent_shank`, `dent_temple` | red (details in the round's run) |

Frames (`f1-front`, `f1-left`, `f1-back`): a cone behind each buttock reaching about 80 mm behind the back's line with a folded band under it; a thin blade standing out of each arm root at mid-chest; a dark band under the jaw; the underwear's edges over chest, waist and thigh tops.

| Row | Phenomenon | Root cause | Same class elsewhere | Pieces, seams, files |
| --- | --- | --- | --- | --- |
| C2-1 | Neck rims at 1458 to 1465 and grooves at 1434 to 1438 round the neck; shoulder rims at 1393 to 1396 | The neck chain is the prior's 21 mm band under the head's seat (1458, the cervicale): its two ends are the two rows of kinks. The shoulder line runs from the shoulder point to that band's bottom (1437), 42 mm over 120 mm of width, so the cap and the line meet at a steep slope. The neck base girth's course (ISO 8559-1 5.3.3: cervicale, side neck points, suprasternale) is not built; `sideNeckPointHeight` and `suprasternaleHeight` are read by no piece, and the trunk's cervicale is the population share 0.8605 S | the trunk's top rows are level planes, so a course whose front stands 69 mm under its sides cannot be copied by them | `AutoMovieHumanNeckConstruction`, `AutoMovieHumanNeckPrior.drop`, `AutoMovieHumanBodyLaw.neckLength`, `AutoMovieHumanTrunkSolver.context`, `AutoMovieHumanTrunkLandmarks.CERVICALE`, `AutoMovieHumanTrunkChains` |
| C2-2 | Cone behind each buttock (side 9.01 mm rise at 928) | `AutoMovieHumanTrunkKeys` gives the buttock key no back place, so the base runs through the crotch and the high hip far inside, and the gluteal relief's peaked `(1 - rho^2)^3` profile carries the whole depth | the breast dome uses the same profile | `AutoMovieHumanTrunkKeys`, `AutoMovieHumanGlutealDome` |
| C2-3 | Blade at each arm root | `AutoMovieHumanArmLaw.point` fades the tube's section out onto the trunk's arc over `REACH` (70 mm), the forbidden fade of a mismatch; `AutoMovieHumanArmChain.of` with the root strip (`AutoMovieHumanArmRootStrip`) exists and is called by nothing | | `arm/AutoMovieHumanArmLaw.ts`, `arm/AutoMovieHumanArmLayers.ts`, `arm/AutoMovieHumanArmChain.ts` |
| C2-4 | Knee centre 4 mm ahead of the hip-ankle chord | `AutoMovieHumanLegBones.KNEE_AHEAD`, f1's former fitted value | | `leg/AutoMovieHumanLegBones.ts` |
| C2-5 | Observers that cannot see their made defect (plate, lump, neck ring, right shoulder ring) | to trace | | `HumanCurveSilhouette`, `assertHumanCurveKinks` |

## Handover

State at 2026-11-04 04:11, wrapped up on the owner's order. `packages/human` type-checks clean (`pnpm exec ttsc --noEmit`, 04:11).

Debt cleared (passes 1 and 2 below): one person's data (the specimen calibration), the root file over 500 lines, every forward-only and single-constant file the surveys found (binding regions, trunk guides, sectors and midline frames, foot section pieces, knot regions, guides, malleoli and columns, leg windows, guides and sectors, arm lines and sectors, hand masses, straight neutral hinges, gluteal and breast profile heights, thoracic wall), the fixed hair flow vectors, and the direct input reads (all now through `AutoMovieHumanBodyAnatomy.resolve` and `AutoMovieHumanHeadAnatomy.resolve`).

Debt remaining:

- The third survey, a hash of every file's code with names and numbers masked to find files of one structure, was stopped unfinished at the wrap-up; run it again before calling the surveys dry.
- One person's absolute values kept as conventions, to be turned into functions of the person's inputs with a modeling law: `AutoMovieHumanLegBones.KNEE_AHEAD` (4 mm, f1's former line), the hand's digit shares observed on f1 only (`AutoMovieHumanDigitSpan`, `AutoMovieHumanDigitPalmarShare`, `AutoMovieHumanDigitJointRelief`, `AutoMovieHumanArmPrior` hand rows).
- The fitted priors with slider coefficients (`AutoMovieHumanTrunkPrior`, `LegPrior`, `NeckPrior` `sex`, `fat`, `muscularity` rows): the sliders now come from measures (`AutoMovieHumanBodyLaw.slider`, the researcher's `sexCoordinate` and `adiposity`), the regressions still stand on them.
- The touched-region tests did not run: `pnpm test:noChecks` answered "Command not found" at 04:09 from the repository root (`.shots/modeler/tests-debt1.log`); the CPU profile of one F1 generation (the 85 s to 3-5 min slowdown) waits for that run, so no time before and after is measured.
- The tester updated its files that named removed modules (hand reliefs, leg patella, foot malleoli) and reports the test project type-check clean at 04:11.
- `body.controls` is gone from the public input (the researcher, 04:10): the sliders are derived from the measures and `frontInterscyeLength` is removed; the four references change slightly (sex coordinate 0.94 to 1, adiposity from the fat percentage).

Modeling (cycle 1, analysed below, not repaired): C1-1 to C1-7.

| Region | State | Open causes and evidence |
| --- | --- | --- |
| Head and neck | open | C1-4, C1-5 (`.shots/debug/f1/modeler-c1-head/`, `modeler-c1-neck/`) |
| Trunk, shoulder, arm | open | C1-1, C1-2, C1-3, C1-6 (`modeler-c1-shoulder/`, `modeler-c1-trunk/`, `modeler-c1-arm/`) |
| Buttock and groin | open | C1-2, C1-7 (`modeler-c1-hip/`) |
| Hand and foot | open, not yet analysed | `modeler-c1-hand/`, `modeler-c1-foot/` |
| Leg and rig | open, not yet analysed | `modeler-c1-leg/`, `modeler-c1-legside/` |
| Hair | open, not yet analysed | `modeler-c1-hair/` |

Next: rerun the third survey; run the touched-region tests and the profile; then finish cycle 1's cause table (curve views `modeler-c1-cv-*` and the pieces `modeler-c1-pieces`) and repair it in one batch.

## 2026-11-04 debt survey, pass 2 (04:05 to 04:10)

Survey: every file again by its code lines, the multi-line search for forward-only functions, files without a function, and the lateral/medial and upper/lower twins compared with their names masked.

| Item | Was | Now |
| --- | --- | --- |
| Twins of one rule | `AutoMovieHumanFootLateralMalleolus`, `AutoMovieHumanFootMedialMalleolus` | `AutoMovieHumanFootMalleolus.of(which, ...)` |
| Twins of one rule | `AutoMovieHumanFootLateralColumn`, `AutoMovieHumanFootMedialColumn` (13 differing lines, all knots) | `AutoMovieHumanFootColumn` (`knots`, `centre` by border) |

Found and kept: the forward-ending functions in files with rules of their own (`FootCrestForefoot`, `AutoMovieHumanRig`, `SpinalGroove`, `HairFlowWeights`, `ArmGirth`), the head's small pieces (each its own rule), the priors and the two new tables. Found and left for modeling: the one-person values listed in the Handover.

## 2026-11-04 debt survey, pass 1 (03:14 to 04:05)

Survey: every `AutoMovieHuman*.ts` of `packages/human/src` by its code lines (comments and imports left out), each file of nine code lines or fewer opened, and a search for files whose function only returns another module's call; then the brief's named items. Criterion: a file adds a rule of its own, or it is debt (a forward, a single constant, a table that a sibling's rule reads, one person's data).

| Item | Was | Now |
| --- | --- | --- |
| Root file over 500 lines | `AutoMovieHuman.ts` 515 lines | the shape stages and their reuse in `AutoMovieHumanShapeStages.ts`; `AutoMovieHuman.ts` 252 lines |
| One person's data | `calibration/AutoMovieHumanBodySpecimenCalibration.ts`, `IAutoMovieHumanBodySpecimen.ts` filled every missing input with f1's fitted controls | removed; tapes from `AutoMovieHumanBodyAnatomy.resolve`, sliders from `AutoMovieHumanBodyLaw.slider` (an unknown `masculineFeminine` the end of the person's sex, `fat` and `muscularity` zero), an unknown `neckLength` the length that stands the head's seat at the cervicale height, an unknown `frontInterscyeLength` null (the anterior axillary guide keeps its population share); `AutoMovieHumanBodyLaw.headInputs` exported for the head pieces |
| Direct input reads | `params.head`, `controls.height`, `controls.neck`, `controls.neckLength`, `controls.masculineFeminine` in the body law, skeleton, appearance, skin, scalp and hair stage | `AutoMovieHumanHeadAnatomy.resolve`, `AutoMovieHumanBodyAnatomy.resolve` (the skin's milky share from the resolved sex) |
| Single-constant files | 11 plain binding regions (`AutoMovieHuman{Lumbar,Cervical,Elbow,Wrist,ThumbMcp,ThumbIp,FingerPip,FingerDip,Knee,Ankle,Toe}Binding`) | rows of `AutoMovieHumanBindingRegions` with their anatomy |
| Forwards | 7 trunk guides and 6 trunk sectors (`AutoMovieHumanTrunkGuide*`, `AutoMovieHumanTrunkSector*`) | one table `AutoMovieHumanTrunkGuides` (`KNOT`, `SHARE`, `jet`, `SECTORS`, `sector`) |
| Forwards | 3 midline frames (`AutoMovieHumanSpinalFrame`, `SternalNotchFrame`, `UmbilicalFrame`) | `AutoMovieHumanTrunkFeatureFrame.midline` |
| Forwards | 7 foot section pieces (`FootDorsalLateralArc`, `FootDorsalMedialArc`, `FootLateralBorder`, `FootMedialArch`, `FootSoleContact`, `FootToeDorsalHalf`, `FootToePlantarHalf`) | tables `AutoMovieHumanFootArc.BODY` and `.TOE` with `pieces` |
| Tables read by a sibling's rule, and their composers | 10 foot knot regions and the 5 foot guides that only concatenated them | `AutoMovieHumanFootKnots` (`GUIDES`, `knots`, `guides`); the regions with their own rule keep their files |
| Same | 13 leg relief windows (`AutoMovieHumanLegPatella` and the others) | `AutoMovieHumanLegReliefWindows` |
| Same | 8 leg guides and 16 leg sectors (`AutoMovieHumanLegGuide*`, `LegThigh*`, `LegShank*`) | `AutoMovieHumanLegSectionRows`; the guide's channel rule moved into `AutoMovieHumanLegGuides` |
| Same | 4 arm lines and 4 arm sectors (`AutoMovieHuman{Anterior,Lateral,Posterior,Medial}Line`, `...Sector`) | one table in `AutoMovieHumanArmRows` |
| Same rule, three files | `AutoMovieHumanFingertipPulp`, `AutoMovieHumanHypothenar` (one elliptic mass rule), `AutoMovieHumanThenar` (dead code) | `AutoMovieHumanHandWindow.PULP`, `.HYPOTHENAR`, `.mass`; the thenar deleted |
| Forwards | 7 straight neutral hinges (`AutoMovieHumanNeutral{Elbow,Wrist,ThumbMcp,ThumbIp,FingerPip,FingerDip,Knee}`) | `AutoMovieHumanNeutralTurn.straighten` in `AutoMovieHumanNeutral` |
| Forwards | `AutoMovieHumanGlutealProfile`, `AutoMovieHumanBreastProfile.height`, `AutoMovieHumanThoracicWall` (its `axis` dead) | inlined in `GlutealDome`, `BreastDome`, `ShoulderRing` (`TrunkRing.controls`) |
| Fixed vectors | `AutoMovieHumanHairFlow{BobFall,ShortRest,ShortTop}` | `AutoMovieHumanHairFlow.COMB`, the style's comb over the head chart's gravity, back and side axes, laid on each root's scalp by the tangent projection |

Kept, each with a rule of its own: the foot regions with a rule (`FootCrestForefoot`, `FootLateralForefoot`, the two columns, `FootHeelCorner`, `FootAchilles`), the toe pieces (`FootToeShaft`, `FootToeCap`, `FootToeRootFlare`, `FootToePulp`), the trunk feature profiles with their constants (`SternalNotchProfile`, `UmbilicalProfile`), `LegSampling`, `GroinBinding`, the hair card pieces, the priors (one fitted table per part).

## 2026-11-04 cycle 1 (inspection, 03:05 to 03:13)

Frames: one generation of f1, source `ffd07c77...`, drawn 03:05 to 03:09 through the batch route with `keep=1`, under `packages/human/.shots/debug/f1/modeler-c1-*/` (whole figure from six cameras; close-ups under raking light of head, neck, shoulder, trunk, hip, arm, hand, leg and foot; appearance of the face and hair; curvature of the whole figure). Curve views are drawn in `modeler-c1-cv-*`.

| Row | Phenomenon | Root cause | Same class elsewhere | Pieces, seams, files |
| --- | --- | --- | --- | --- |
| C1-1 | Wide thin plate over each shoulder, overshooting the arm, from front, back, top (`shoulder/whole.front.png`, `whole/whole.top.png`) | The shoulder line runs from the shoulder point to the neck's bottom ring as `z(y)`, but the neck's bottom ring stands only about 10 mm above the shoulder point: the neck chain is the prior's 21 mm band under the head's seat (`NeckPrior.drop`), so on f1 its bottom ring stands near 1406 mm while the acromion default is 1395 mm, and `TrunkSolver` clamps the shoulder point to `seat.y - 6`. A 120 mm run over 10 mm of height gives the line and the cap below it slopes near 12, and the cap's quintic overshoots outward. Anatomy puts the side neck point above the acromion by the shoulder length times the tangent of the shoulder slope (22.5 degrees, `docs/sources/faa-1965-shoulder-slope.md`), about 45 mm | the head's seat reads `neckLength` (no definition) instead of the cervicale height | `AutoMovieHumanNeckConstruction`, `AutoMovieHumanHeadConstruction.seat`, `AutoMovieHumanTrunkSolver.context`, `AutoMovieHumanShoulderLine`, `AutoMovieHumanShoulderCap` |
| C1-2 | Cone behind each buttock with a hard lower edge and a folded dark band under it (`hip/whole.left.png`, `whole.back.png`) | The buttock key has no back place (`TrunkKeys`, `back: null`), so the base's back at the buttock point runs through the crotch ring and the high hip, far inside; the relief must supply the whole depth (`buttockProjection`) with the peaked `(1 - rho^2)^3` profile, and it moves the base along a fixed tilted axis, so the lower side overhangs and folds | the breast relief uses the same profile | `AutoMovieHumanTrunkKeys`, `AutoMovieHumanGlutealDome`, `AutoMovieHumanGlutealRelief`, `AutoMovieHumanTrunkReliefNet` |
| C1-3 | Flat chest: no breast, only the areola marks (`trunk/whole.front.png`, `whole.left.png`) | to confirm with the diagnostics: the breast window is now unbounded above (`BreastRelief` lost its ceiling) and is probably refused by `TrunkFeatures.guarded` | | `AutoMovieHumanBreastRelief`, `AutoMovieHumanTrunkFeatures` |
| C1-4 | Neck: horizontal bands and a collar step, a V at the base, a step under the jaw (`neck/whole.front.png`) | follows C1-1 (the neck is a 21 mm band); to trace in `cv-neck` | | `AutoMovieHumanNeckConstruction`, head lower sections (`HeadNeckBase.neckFade`) |
| C1-5 | Forehead band and temple grooves, eyelid step, chin step (`head/whole.front.png`) | to trace | | head pieces |
| C1-6 | Fin round the upper arm under the shoulder, front and back (`arm/whole.front.png`) | the arm law fades its sections onto the trunk's arc over `REACH`; the root strip is unbuilt | | `arm/AutoMovieHumanArmLaw.ts`, `arm/AutoMovieHumanArmRootStrip.ts` |
| C1-7 | Ring round the top of each thigh, a bright band and a hollow under the buttocks (`hip/whole.back.png`, `curv/whole.front.png`) | the groin seam is two fits and a fade (`seam-registry.md`) | | `leg/AutoMovieHumanLegCrotchRoot.ts`, `LegCrotchSlope`, `LegCrotchFillet` |
