# Input and laws worker log

The input and laws worker's log for campaign #3044: #3045 and the published laws that replace the priors fitted on the references.

## Input and laws worker, #3045 and the prior replacements (appended 13:39, `date`)

Paths I edit and commit: `packages/human/src/structures/body/IAutoMovieHumanBodyAnatomy.ts`, `IAutoMovieHumanBodyIdentity.ts`, `IAutoMovieHumanArmIdentity.ts`, `IAutoMovieHumanLegIdentity.ts`; `packages/human/src/generation/AutoMovieHumanBodyAnatomy.ts`, `AutoMovieHumanBodyBox.ts`, `AutoMovieHumanBodyFat.ts`, the one seeding line in `AutoMovieHumanBodyLaw.calibrate`; `packages/playground/src/human-editor/HumanEditorMeasureFields.ts` and `packages/playground/src/human-parameters/<alias>.ts`; `test/src/features/internal/HumanSurveyData.ts`, `test/src/features/human/survey/`, `test/src/features/human/curves/input/test_human_input_anatomy_defaults.ts`, `test_human_input_box_consistency.ts`, `test/src/features/human/reference/anatomy/test_human_reference_inputs.ts`; then each prior file of owner rule 3 as I replace it; `packages/human/docs/work/parameter-anatomy-survey.md`.

Collectors: human `ttsc --noEmit --watch -p tsconfig.debug.json` process 34464 and test `ttsc --noEmit --watch` process 55332, both started 13:11:44 (Get-Date), logs in my scratchpad outside the checkout.

Design (#3045):

- Source correction: ANSUR 1988's public data takes its waist breadth and depth at the navel (`WAIST_BRTH_OMPHALION`, `WAIST_DEPTH-OMPHALION`), not at the natural waist, and takes no bicristal breadth (`BISPINOUS_BRTH` is between the anterior superior iliac spines). Supervisor approved: the natural-waist breadth and depth are the navel section's law (breadth and depth on the girth of the same level, ANSUR 1988 by sex) evaluated at the natural-waist girth, a derivation with its assumption recorded; bicristal from ANSUR II; the bideltoid predictor the Human input with the best R2. #3045's body was corrected and read back.
- Each fit is a tracked reading test under `test/src/features/human/survey/` (supervisor order: not a helper under `debug/`), fetching the public files into memory through `test/src/features/internal/HumanSurveyData.ts`; no data is stored.
- `AutoMovieHumanBodyBox`: the chest, natural-waist and hip boxes, the taut-tape range `2 sqrt(W^2 + D^2)` to `2 (W + D)`, `place` (every default held inside the range the supplied measures leave), `diagnose` (one level-1 diagnostic per contradicted level, producer `human.inputs`), `of` (each box's tape held at the nearest end and its fullness in the range for the trunk's solve). `AutoMovieHumanBodyLaw.calibrate` seeds the calibration's diagnostics with it.
- `IAutoMovieHumanBodyIdentity` now takes every measure the anatomy also declares from `IAutoMovieHumanBodyAnatomy` (`Required<Pick<...>>`; its `buttockCircumference` is the anatomy's `hipCircumference`), and the arm and leg identities type their shared girths and lengths from it, so no measure has two ranges.
- `AutoMovieHumanBodyAnatomy.ts` would pass 500 lines, so the Navy fat estimate moved to `AutoMovieHumanBodyFat.ts` unchanged.

Violation 13:18:27 (`date`): one of my Bash commands began with a stray `python -`, which waited on its input until I stopped the task; it ran no code, and the edit chained after it did not apply. No Python ran; every helper here is TypeScript.

A `pnpm install` started by another agent at 13:18:59 rewrote `node_modules` while my first survey run compiled, so that run stopped on missing modules; the rerun started 13:22:46 has waited on the ttsc plugin cache locks held by other processes since.

### #3045 state before its first commit (written 14:04, `date`)

- Owner orders relayed: no own ttsc (my collectors 34464 and 55332 were already gone at 13:44:27 when I went to stop them; compile state from the three shared logs in `packages/human/.shots/debug/` only); no test runs until relayed; reference tests retired (my edits to `test_human_reference_inputs` reverted, the tester deleted it in 30732a487; #3045's step 5 and acceptance edited accordingly and read back).
- Test runs attempted before the stop: 13:11 (stopped by another agent's `pnpm install` at 13:18:59), 13:22 (stopped on another worker's type error), 13:40 and 13:46 with `--noCheck` (refused by ttsx), 13:53 (refused by ttsx 0.36's emit provenance check). No survey reading has printed.
- So the trunk defaults are interim: ANSUR II model B on stature, BMI and age (`AutoMovieHumanBodyBreadths`, coefficients from `docs/sources/ansur-ii.md`), each held in its box. Pending, with code and citation ready in the readings: chest depth, hip breadth and buttock depth on their girths (ANSUR 1988), the natural waist by the navel section's law (ANSUR 1988), the bideltoid and bicristal predictors by R2, and the survey's own box fullness (`test_human_survey_box_consistency`).
- Compile: my files clean in the shared test watch cycle that ended after 14:02:39 (its only errors `AutoMovieHumanApertureSpan.ts:426`, another worker's).
- Trunk laws queued for the body modeler, module names agreed: `AutoMovieHumanLumbarSection.box`, `AutoMovieHumanChestWall.box` (Heinz 2003 reading written: `test_human_survey_chest_wall`), `AutoMovieHumanTrapeziusLine.of` (ANSUR 1988 reading written: `test_human_survey_shoulder_line`), `AutoMovieHumanBackProfile.at` (Ohlendorf et al. 2023, Sci Rep 13:873, PMC9845304, read through Europe PMC: kyphosis 56.28 / 51.29 and lordosis 49.02 / 31.96 degrees, thoracic bending 13.90 / 16.23 and lumbar bending 14.25 / 10.56 degrees, women / men, 21 to 60 years), `AutoMovieHumanNavel.size`; the calf's site reading written (`test_human_survey_calf_site`).

### Laws landed after the survey readings (written 14:55, `date`)

The supervisor ran my nine survey readings once in the owner's test window (14:26:02 to 14:30:04, 9 of 9 passed); I ran no test. Each number below cites its reading.

| Commit | Law | Source |
| --- | --- | --- |
| `55f5543f1` | `AutoMovieHumanBackProfile` | Ohlendorf et al. 2023 rasterstereography, Gray 1918 column split; it predicts the published lumbar bending angle (14.24 against 14.25 degrees in women) |
| `ffa2662a8`, `43f825d32` | `AutoMovieHumanLumbarSection` | ANSUR 1988 navel section lines |
| `26ad32c75`, `7c2f2bdc6` | `AutoMovieHumanTrapeziusLine` | ANSUR 1988 run on biacromial breadth, person's heights |
| `034b2e296`, `ab283ac60` | `AutoMovieHumanChestWall` | Heinz 2003 caliper thorax; a third of the girths exceed the caliper box, so the box is scaled at its ratio |
| `36efc4ae9` | #3045 defaults by their girths' lines | ANSUR 1988 and II; the chest breadth takes ANSUR 1988's definition (577 of ANSUR II's men exceed their chest box) |
| `6d0a739ae` | `waistHeight` input | ANSUR 1988 share of trochanterion to cervicale |
| `f7336fdff` | foot girths, instep, crotch lengths as inputs | ANSUR II and 1988 |
| `009dc2413` | `AutoMovieHumanLegSites` (calf site, thigh depth) | ANSUR 1988 calf height and thigh clearance |
| `bd5004469` | `AutoMovieHumanLimbBonePlace` | Kanehisa and Fukunaga 2013 ultrasound muscle thickness |

Open, with reasons:

- Width-to-depth at limb tape sites other than the thigh: the surveys take no limb depth; the MRI and ultrasound studies of limb sections are behind publisher and PMC bot walls from this machine (only Europe PMC's open-access XML is reachable); de Leva 1996's radii of gyration give an impossible upper arm (115 by 39 mm), so they do not carry section shape.
- The forearm's bone place: the open ultrasound source takes only an anterior forearm site.
- Soft tissue over the acromion, epicondyles, malleoli and stylion: no reachable published thickness.
- Cervicale's absolute forward place: the skeleton chain (SVA, S1 depth, C7 morphometry) needs vertebral morphometry I cannot reach; the supervisor directed reading it from skin measures, and the back profile gives cervicale relative to the PSIS skin, so the absolute place waits on the pelvis's skin landmark relative to the hip joints (Harrington 2007 needs a pelvic depth not in the surveys).
- Violation recorded earlier stands (13:18:27, a stray `python -`, no code ran).

### Open items searched after the supervisor's 14:58 list (written 15:08, `date`)

Searches through Europe PMC's open-access full text (the one reachable route; DTIC, nature.com, thieme and PMC's own pages refuse this machine):

- Hand: landed `7f7f0c800`, `AutoMovieHumanDigitJoints` (Rastgoo Balov et al. 2026, PMC13039577: every digit's breadth and girth at its two distal joints, 51 women and 49 men). Still open: the joints' depths (no open source tabulates them; each is bounded by its box), the palm's thickness profile and metacarpal arch, and a resting posture (the open kinematics papers found record tasks, not rest). Greiner 1991 (DTIC ADA244533), which tabulates digit breadths and depths, answers 403.
- Foot: the open 3D scan studies found (PMC11633873, PMC13687573, PMC12206372) define instep height and ball measures but carry their values in tables the open XML does not hold. Yaw, malleolar centre, metatarsal head places and forefoot height stay open. Landed earlier: `AutoMovieHumanFootArch`, the foot girths and instep length as inputs.
- Limb width-to-depth and soft tissue over bony landmarks: the open ultrasound studies found give subcutaneous fat at fat sites (PMC7018793, athletes) or muscle thickness (`AutoMovieHumanLimbBonePlace`), not section depth or soft tissue over the acromion, epicondyles, malleoli or stylion. Open.
- Cervicale's forward place: PMC3991691 (skin markers against upright MRI of the back) is a lead for the soft tissue over the spinous processes; the pelvis's skin landmarks against the hip joints were not found open. Open.

### Pass 2 and the reference-curve estimates (written 15:52, `date`)

The supervisor's pass 2 (owner's window) ran `test_human_input_anatomy_defaults` and `test_human_input_box_consistency` (2 of 2 passed) and my three readings (3 of 3). #3045's universality item hit a tool error and waits; #3045 stays open until it passes. The owner then stopped all test runs until he calls for them.

The owner approved estimates from the private reference curves (`.references/curves`), aggregated over the four people as normalized ratios, labelled "estimated from the private reference set; no published source found", read by tracked tests that print only aggregates (`test/src/features/human/estimate/`, loader `test/src/features/internal/HumanReferenceSections.ts`, shape reader `HumanSectionShape.ts`; no curve or person's value enters the repository).

Landed after pass 2: `AutoMovieHumanHeadArcs` (584342f8b), `AutoMovieHumanEarPlace` (9983af64e), `AutoMovieHumanBodyPlaces` (c77eab89c, estimate), `AutoMovieHumanLegSection` (64bac6ae2, estimate), `AutoMovieHumanFootPlaces` (b8a809ffa, estimate), `AutoMovieHumanGlabellaHeight` (75cb7e3e0, derivation), `AutoMovieHumanFacePlan` (1a3118666, derivation), `AutoMovieHumanFaceTissue` (f8659dee7, the 2023 T-Table), `AutoMovieHumanDigitJoints` (7f7f0c800).

Readings written, numbers pending the owner's window: `test_human_estimate_trunk_outline`, `test_human_estimate_head_outline` (d3ee94885), `test_human_estimate_arm_sections`, `test_human_estimate_foot_outline` (5a8e27b00). Still to write: the masses' footprints, the face's malar, nose, lips, lids and ear outlines, the digits.

Findings to keep: the estimated cervicale reads on two people and the perineum's spread (SD 0.034 of stature) equals its mean; the leg's breadth over depth is 0.81 at the ankle and 0.90 to 1.00 elsewhere, with a fullness near 0.25 (an ellipse's); the foot's dorsum at half its length reads 0.209 of its length on the references against Williams and McClay's published 0.214.

### Readings waiting for the next run (written 15:58, `date`)

One program, the supervisor's, after the owner's fixed ttsx; I fill each table from its output:

```bash
pnpm test --include test_human_estimate_trunk_outline test_human_estimate_head_outline test_human_estimate_arm_sections test_human_estimate_foot_outline test_human_estimate_face_profile test_human_estimate_masses test_human_estimate_ear_outline test_human_estimate_lid_margins test_human_estimate_digits test_human_estimate_nasion_ear test_human_estimate_sites test_human_estimate_face_detail test_human_estimate_leg_split test_human_estimate_thigh_split test_human_estimate_fold_radii
```

| Reading | Table it fills | Reader it replaces |
| --- | --- | --- |
| `test_human_estimate_trunk_outline` | trunk half breadth, front and back places, quarter shoulders by share of crotch to cervicale | the body modeler's upperSites, cervicaleForward, perineumForward |
| `test_human_estimate_head_outline` | head mass P, B, L and quarter shoulders by share of menton to vertex | the head prior's outline rows |
| `test_human_estimate_arm_sections` | arm's four extents per girth and shoulders along forearm and upper arm | the body modeler's armSites |
| `test_human_estimate_foot_outline` | foot's lateral and medial edges, dorsum and plantar heights along its axis | foot() |
| `test_human_estimate_face_profile` | the face's midline profile (nose, lips, chin) and front contour setback across the face (cheek, malar) | the head prior's profile and relief rows |
| `test_human_estimate_masses` | breast and gluteal profiles about their points, vertical and horizontal | the masses' footprint and profile |

Added at the supervisor's 16:00 order: `test_human_estimate_ear_outline` (the ear's side outline, its rim standing clear of the head projected onto the sagittal plane), `test_human_estimate_lid_margins` (the fissure's outline and the margins' forward places from the skin arcs' ends near the eyes), `test_human_estimate_digits` (each hand's digit chains reprojected normal to their axes, with each person's hands recorded as holding or not). The palm's thickness and the named digits' posture wait on what the digit reading shows.

### Thigh split, suprapatella and the fold radii's lead (written 16:23, `date`)

- `test_human_estimate_thigh_split` (pending run): the thigh's lateral share about the femur's line, the line placed by Hara 2016's hip centre (from leg length, read as the trochanterion height) and de Leva 1996's knee centre, the split read on the curves.
- `AutoMovieHumanSuprapatella.height(measures)`: mid-patella (ANSUR II's share of stature) plus half the patella's length, 38.83 mm over 168 dry patellae (Kafa et al. 2024, Cureus, PMC11157160), the lower thigh tape's site.
- Fold radii, lead: Störchle et al. 2018 (Sci Rep 8:16268, PMC6214952) measured the mean subcutaneous fat thickness over 216 sites, 3.69 mm in ten young men, and its relation to the subcutaneous fat's volume over the body's surface area; a fold's radius as the local layer's thickness needs the layer by site from the fat percentage, which those ten men alone do not give. Open; the eight-site atlas's site table (Störchle 2017, Ultrasound Med Biol) is the next source to read.
- Nail plate size: open, no source read yet.

### Prepared for the paste (written after 17:45, `date`)

The outline tables wait in `AutoMovieHumanReferenceOutlines` (empty rows; `at(table, column, share)` reports an unfilled table): TRUNK, HEAD, FOREARM, UPPER_ARM, FOOT, FACE, BREAST, GLUTEAL, EAR, FISSURE, LIPS, SHANK_SPLIT, THIGH_SPLIT, each naming its reading, normalization and consumers. The scalar readings fill these: `test_human_estimate_nasion_ear` (HeadPrior's profile.nasion and ear.forward, a law beside `AutoMovieHumanGlabellaHeight`), `test_human_estimate_sites` (the ankle's least-girth share, the toes' tips and centres, the neck's ratio and fullness: `AutoMovieHumanLegSites`, `AutoMovieHumanFootPlaces`, a neck section law), `test_human_estimate_face_detail` (the orbit's brow and cheek lead, nostril size, concha depth), `test_human_estimate_digits` (each hand's chains, depth over breadth and bend), `test_human_estimate_fold_radii` (the four folds' radii per stature). The run waits on ttsx 0.36.1's TTSC_TSGO_ARGS fault (17:38:55 to 17:44:19, failed before any test).

### The fifteen readings and the tables (written 18:20, `date`)

- Run 17:58:48 to 18:08:11 (`Get-Date`) on the patched ttsc 0.36.1 runner: 14 of 15 passed. `test_human_estimate_lid_margins` overflowed the stack (`Math.max` over a spread of every head point).
- Filled in aa6db2dd5: twelve tables in `AutoMovieHumanReferenceOutlines` (TRUNK, HEAD, FOREARM, UPPER_ARM, FOOT, FACE, BREAST, GLUTEAL, EAR, LIPS, SHANK_SPLIT, THIGH_SPLIT). Each row holds the mean and the SD over the people. A cell is kept when it was read on at least two people and its SD is at most 0.25 of its normalizing measure. For the per-stature mass tables, the SD must instead be at most the mean's magnitude. `at` reads a column through the rows that keep it. Left out by the rule: HEAD P and B where one person's reading flipped (SD 0.3 to 0.5), FACE share 0.80 and 0.85 midline and the whole setback1 column, EAR anterior at 0.1, LIPS 0.3, 0.9 and 1.0, TRUNK share 0.75 (one person).
- Laws in a9b4f0d0e: `AutoMovieHumanLegSites.ankle` (1.913, SD 0.138, of the lateral malleolus height), `AutoMovieHumanEarPlace.forward` (front -0.0996, SD 0.0068; centre -0.1406, SD 0.0215, per head length) and `concha` (1.058, SD 0.096, of the protrusion), and `AutoMovieHumanNeckSection.box` (breadth over depth 0.983, SD 0.104; fullness 0.245, SD 0.043).
- Reading faults fixed in 85c463a3c, waiting for a rerun: the lid reading's overflow; the nasion reading, which counted a row without front skin, whose midline lies at the back of the head (it gave 1.60 face heights); and the toe reading, which kept each toe's lowest loop instead of its foremost point (tips 0.77 to 0.92 of the foot length). FISSURE, the nasion law and `AutoMovieHumanFootPlaces.TOES` wait for that rerun.
- Left open as too spread: the orbit's brow and cheek lead (0.023, SD 0.133; -0.034, SD 0.150), the nostrils (0.120, SD 0.106; 0.145, SD 0.136), the digits (the chains hold on one person's hands only; depth over breadth about 0.5, SD 0.2), and the fold radii (gluteal SD above the mean; axilla 0.2 mm, which is not a radius; groin 0.26 of stature, SD 0.09, of unclear meaning).
- 18:12:35 to 18:14:48: the rerun of the lid and nasion readings stopped at compile. The errors were in the engine's `AutoMovieConstructionRing.ts` and `AutoMovieConstructionState.ts`, which are not my files.
- Rerun 18:36:39 to 18:41:26 (`Get-Date`): the lid, nasion and sites readings passed 3 of 3. The rerun first stopped twice on other agents' edits: a parse error in `AutoMovieHumanMassPart.ts` at 18:22:58, and the `lofting` folder deleted during discovery at 18:29:45. FISSURE is filled. Its forward column is kept at every station (SD 0.012 to 0.034). Upper and lower are kept only near the canthi, because the middle of the fissure reads both lids on some eyes (SD 0.27 to 0.48). `AutoMovieHumanFootPlaces.TOES` now uses each toe's foremost point: tips 0.968, 0.978, 0.935, 0.873 and 0.788 of the foot length (SD 0.013 to 0.021). The nasion's depth behind the glabella reads -0.0027 (SD 0.0407) face heights: no depth, with a spread fifteen times the mean. That law stays open. The glabella's rise reads 0.151 (SD 0.045), above the published law's 0.08 to 0.11, and the published law stays.
