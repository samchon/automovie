# Human reproduction status

The continuation of [#2925](https://github.com/samchon/automovie/issues/2925) after the [#2973](https://github.com/samchon/automovie/pull/2973) checkpoint runs in draft [#2976](https://github.com/samchon/automovie/pull/2976). The user set the bar for this round as an adequate, presentable result rather than exhaustive precision, with hair kept as textured cards and only its balding look corrected. No specimen has passed whole-body acceptance.

## Public generation path

`AutoMovieHuman.generate(params)` lofts the calibration that `AutoMovieHumanBodyLaw.calibrate(params)` returns; skin, construction curves, apertures, globes, poles, the lip boundary, the appearance layer, the stickman skeleton and the playground's curve diagrams all read that one object.

1. The specimen calibration (`AutoMovieHumanBodyCalibration`) merges the region calibrations, low-passes the sections within 15 mm of the crotch ring (`AutoMovieHumanContactSmoothing`) and re-slopes every event child into its parent's tangent plane (`AutoMovieHumanEventJoin`).
2. A masculine-feminine shape basis (`AutoMovieHumanBodyMorphCalibration`) displaces it by the input's offset from the specimen's own value. The four reference meshes share one vertex order, so `fitBodyMorph.ts` reads each other specimen at the barycentric address of the calibrated f1 surface, normalizes it to f1's stature and reduces the three displacements to one least-squares direction through f1. The out-of-plane part becomes the layers' `lift`.
3. A measurement law (`AutoMovieHumanBodyWarpField`, `AutoMovieHumanBodyWarp`) brings tape girths, the crotch's share of the stature and the head length and breadth to the inputs in stature units. Each target is the specimen's own geometry times the input ratio, divided by the body after the basis, so the basis's own size change is not counted twice. Branches move rigidly with their parent's map and blend to it within 40 mm of the ring.
4. The stature control then scales the result uniformly; the measurement law adjusts the calibration stature by the crotch's rise, so the person still reaches the height input.

The specimen's own parameters return the specimen calibration object unchanged at every step.

## Results of this round

| Change | Measured effect |
| --- | --- |
| Event tangent planes | 90th-percentile crease 1.3 to 0.6 degrees at the 1543.2 mm head ring and 4.3 to 3.2 at the 1595.5 mm ring; the worst points beside the outer eye corners stay near 20 degrees because the skin there lies almost in the section plane |
| Crotch low-pass | Curvature sign changes around the crotch ring 128 to 12 and on the legs' top section 62 to 8; the crotch ring moves at most 1.76 mm, the pinches not at all |
| Bell-shaped hairline | Midline from 0.42 to 0.37 of head height above the eyes, read as a straight trichion-glabella distance, with a domed outline |
| Hair undercoat | Raised from 0.5 to 1 mm above the skin, which removed the skin showing through at the vault in front views |
| f2, m1, m2 | Each generates from its own typed parameters; m1 and m2 take a male torso, shoulders and face from the basis; f2 differs from f1 by its girths, crotch height and head size |

The basis addresses its samples 0.085 mm from the f1 reference mesh on average (3.04 mm at most, on the head). Generation takes 13 to 35 s per person in Node on this machine.

## Specimen status

| Specimen | Qualification |
| --- | --- |
| f1 | Whole body assembled from its calibration; visible defects below remain; not accepted |
| f2 | Shape law reproduces stature, girths, crotch height and head size; face and bust shape stay f1's |
| m1 | Male body from the basis plus its measures; face broad form only |
| m2 | As m1; m1 and m2 differ only by their measures |

Three specimens identify one basis direction. The law makes no prediction claim for other inputs, and arm and leg lengths other than the inseam are not read yet.

## Open defects

The face defects below were traced in `claude-inspect-r7`; their causes sit in the head calibration's section fits, so they need a head fitter round rather than another runtime pass.

| Defect | Traced cause |
| --- | --- |
| A thin groove at eye height from each outer eye corner back toward the temple | The 1595.5 mm ring, where both upper helices leave the head, sits at the canthus; the layers on both sides are 0.8 to 1 mm apart and fitted independently, so the section curvature jumps across the ring although the tangent planes now agree. The worst tangent mismatch, about 20 degrees, is beside the canthus where the skin lies almost in the section plane |
| Notches at both mouth corners, which catch a white highlight in colour renders | The `head.lower` sections through the lips ring at the front (10 to 18 curvature sign changes per section at 1518 to 1532 mm, with crossing combs at the commissures); in clay the notch is dark, so the highlight is the material's specular on the notch, not lip albedo |
| A faint horizontal line just under the nostrils across the cheeks | The 1543.2 mm ring between `head.lower` and `head.middle` |
| Blocky lip colour edges | The vermilion boundary is sampled per vertex on the notched surface |

- The lateral eye corner opening past the globe, rough auricle rims, nostril interiors and eyelid margins.
- A horizontal band at about 1040 mm on the abdomen, also present in the original reference renders and strongest on f2.
- The gluteal fold and axillary rings remain straight horizontal lines, by the horizontal-section representation; a raking view of the front armpit shows a lump that is present with or without the crotch filter.
- Hair: ragged bottom fringe, a highlight strip down the back, strands standing off the sides.
- Hands and feet: distal shapes, webs and nail corners as described in the checkpoint below.

## Evidence

Local captures are under `packages/playground/.shots/`: periodic audits `claude-audit-001` through `claude-audit-010`, inspections `claude-inspect-r1` through `claude-inspect-r7`, final per-person frames `claude-final-r1`, and the failed audit `claude-audit-005-failed`. One m1 frame in `claude-inspect-r6` returned 500 while the worker page reloaded between people; the retry in `claude-final-r1` succeeded. Audit 005's first attempt failed for 35 minutes because a scratch `ttsc --emit` wrote JavaScript beside the Human sources; the page loaded those stale files and never became ready. Deleting exactly the 483 emitted files and touching the sources restored it without restarting the server.

## Earlier work

The checkpoint's off-live head reconstruction, its fitters and its meshing experiments remain rejected; their measurements and counterexamples stay under `packages/playground/.shots/solo-head-*` and `solo-handoff-final-*`. The [#2973](https://github.com/samchon/automovie/pull/2973) version of this file records them in full. None of them is in the live import graph.
