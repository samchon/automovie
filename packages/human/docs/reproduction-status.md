# Human reproduction status

The close-up quality campaign [#2977](https://github.com/samchon/automovie/issues/2977) continues [#2925](https://github.com/samchon/automovie/issues/2925) after [#2976](https://github.com/samchon/automovie/pull/2976). The user set the bar as an adequate, presentable result rather than exhaustive precision, with hair kept as textured cards. No specimen has passed whole-body acceptance.

## Public generation path

`AutoMovieHuman.generate(params)` lofts the calibration that `AutoMovieHumanBodyLaw.calibrate(params)` returns; skin, construction curves, apertures, globes, poles, the lip boundary, the appearance layer, the stickman skeleton and the playground's curve diagrams all read that one object.

1. The specimen calibration (`AutoMovieHumanBodyCalibration`) merges the region calibrations and applies five continuity rules in order: the contact low-pass at the crotch, axillae, neck, head rings and webs (`AutoMovieHumanContactSmoothing`); the lip low-pass along the sections round the vermilion (`AutoMovieHumanLipSmoothing`); the station low-pass where the oral line and the upper-lid crease end, at the commissures and lateral canthi (`AutoMovieHumanCornerSmoothing`); the dense-layer line fit and the clamped C2 station slopes (`AutoMovieHumanStationContinuity`); and the event join, which moves every child onto its parent's ring and into its tangent plane (`AutoMovieHumanEventJoin`).
2. A masculine-feminine shape basis (`AutoMovieHumanBodyMorphCalibration`) displaces it by the input's offset from the specimen's own value. `fitBodyMorph.ts` reads each other specimen at the barycentric address of the calibrated f1 surface and averages each layer's displacement over 1.5 mm of station, since the addresses lie up to 3 mm off the reference surface on the head.
3. A measurement law (`AutoMovieHumanBodyWarpField`, `AutoMovieHumanBodyWarp`) brings girths, widths and lengths to the inputs in stature units: girths, the crotch height, the arm segments along their axes, the neck and lower face, the shoulder width and bust span, the head length and breadth and the face widths at their landmarks (`AutoMovieHumanBodyLandmarks`, in world heights). Each target is the specimen's own measure times the input ratio, over the same measure of the body after the basis. The event join runs again on the result.
4. The stature control then scales the result uniformly.

The specimen's own parameters return the specimen calibration object unchanged at every step. Skin vertices with loft coordinates shade with their chain surface's own normal rather than the triangles' average (`AutoMovieHumanBodySurface`): the lines along the head rings and round the hips were the mesh's sheared bands on a surface whose profile is smooth. Rounded poles start their domes at the first full layer (`AutoMovieHumanBodySurface`), and aperture rims average their skin gradients along the rim before the lids and nostril pockets are built (`AutoMovieHumanSkinProjection.rim`); slivers of skin the cut leaves inside an opening are dropped (`AutoMovieHumanBodyApertures.cut`), which a 0.6 mm island beside m2's right medial canthus had turned into a second margin loop.

## Results of this round

| Change | Measured effect |
| --- | --- |
| Event position join | m1's child rings off their parents' fell from 0.45 to 0.16 mm (median) at the crotch, 0.33 to 0.23 at the arms, 0.16 to 0.10 below the nose, to the measurement's own resolution |
| Axilla and neck low-pass | Curvature sign changes next to the axillary ring 56 to 16 (shoulder) and 62 to 18 (trunk); at the neck base 42 to 14 and 48 to 20 |
| Corner low-pass | Oral line 2 mm inside each commissure 2.4 to 1.0 mm deep, at the commissure 1.4 to 0.2 mm; the groove above each lateral canthus 0.5 to 0.1 mm |
| Dome poles | Finger and toe tips round from their first full layer (index finger 5.0 mm radius 5.4 mm from the tip) instead of a cone onto a 0.1 mm point ring |
| Dense-layer line fit | The helix's last interval no longer shelves (plan change 0.23 mm as fitted, against 0.73 with a plain average) |
| Surface normals | Profiles in fixed planes across the 1595.5 mm ring beside the eye and across the crotch ring at the hip are smooth to 0.1 mm; their shading lines came from the mesh, and the normals now come from the surface |
| Shape law lengths | See the table below |

## Shape law against the inputs

Each value is the input and the generated measure under the same definition, both relative to the specimen in stature units (f1 is the specimen and reproduces every input exactly).

| Input (mm) | f2 | m1 | m2 |
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

Each cell is input / generated. The residuals come from landmarks the warp itself moves: the menton and the jaw-angle height shift with the face stretch, so the neck and mandibular widths are read at slightly different places than the law set them. Before this round the law read neither the face inputs nor the arm, neck, shoulder and bust lengths.

## Specimen status

| Specimen | Qualification |
| --- | --- |
| f1 | Whole body assembled from its calibration; the defects below remain; not accepted |
| f2 | Shape law reproduces stature, girths, lengths, crotch height and head and face size; face shape stays f1's |
| m1 | Male body and face from the basis plus its measures |
| m2 | As m1; m1 and m2 differ by their measures |

Three specimens identify one basis direction. The law makes no prediction claim for other inputs.

## Open defects

Seen in `campaign-r3` through `campaign-r11` and traced as below.

| Defect | Traced cause |
| --- | --- |
| A short trace of the fin at each helix root and stair steps across the auricle | The fin's length was a kink in the upper head's fitted sections 0.8 to 2.4 mm above the 1595.5 mm ring (control points bunched at x 32 mm, a 20 to 30 degree bend within 0.1 mm), and 34 auricle and foot layers wound two or three times; `AutoMovieHumanSectionLoops` removes both. What remains is the corner of the shared ring itself, which the rule keeps. Joining rings by shorter diagonals instead of equal phases (tried) left the shading unchanged, since normals come from the chain surface, and drew a blade at the crotch and folds at the axillae |
| A line under the chin along the jaw | The tilted `head.lower` sections at 1495 to 1502 mm ring at the front (10 to 18 curvature sign changes) and advance unevenly between layers 1.5 mm apart, which the dense-layer average (reach 1.6 mm) does not reach |
| A line at eye height from the ear to the outer eye corner, strongest on m2, and a ledge beside each lateral canthus | Not the ring itself: shading normals now blend across every event ring, which removed the line under the nose at the 1543.2 mm ring. The exterior observations lose the head outline from 1586.5 to 1597.5 mm, where the palpebral apertures break it, so the head fitter had no rows there: between its layers 1596.3 and 1599.5 mm `head.upper` runs up to 1.4 mm inside the observed skin (the closed horizontal observations still have it), folds at each lateral canthus and climbs back within 0.8 mm. A squared-distance refit of the three head chains' layer values and slopes to the observations, weighted by the surface distance, with the apertures and lips kept, cannot fix it within the per-layer representation: a 0.5 mm correction bending length brings the shelf within 0.15 mm of the observations but copies their 0.1 to 0.2 mm row noise as horizontal ripples across the cheek and the auricle, and a 3 mm one keeps the ripples out and the shelf at 0.9 mm. The layers store the triangulated source's section noise, which is the representation question of the next round |
| Stair steps on the right nostril rim | The cut edge; the interior now reads dark in colour, since the pocket's deep walls take the dim `human.cavity` material instead of the skin's emission, sheen and specular lobe |
| A line across both thighs at the crotch ring on m1 and m2 | A fold of the shape itself at the ring (`campaign-r14/m1-thigh-clay.png`), not a shading fault: the normals turn by up to 9 degrees 3.6 mm into the leg, and widening the normal blend to the leg's 10 mm end interval left the line |
| The gluteal fold stays a horizontal crease | The crotch is a horizontal contact ring; a fold rising toward the hips needs a tilted or curved contact |
| A faint light patch at the left commissure in colour | The corner low-pass now reaches 22 mm past each commissure, which removed the dark line the oral line drew across the right cheek; raking clay shows that corner smooth, so the patch's cause is not yet traced |
| A few bob strands stand off the side and back of the mass | Strands that lie over the auricle's drape above the chart centre leave it pushed out and hang from there, 18 to 43 mm off the mass for the worst; removing the outward heading below the centre left them and roughened the side edges, so it was dropped. The flare at the shoulders is gone: a bob lays at most 10 mm along the body |
| Shape-law residuals | Neck length -6 to -8 percent on m1 and m2 and +11 percent on f2, and m2's mandibular width +20 percent, read at landmarks the face stretch itself moves; the bust span is not measurable on a flat chest |

## Evidence

Local captures are under `packages/playground/.shots/`: periodic audits `claude-audit-001` onward, inspections `claude-inspect-r1` through `claude-inspect-r7` and `campaign-r0` through `campaign-r11`. Frames that returned 500 while the worker page reloaded between people were captured again.

## Earlier work

The checkpoint's off-live head reconstruction, its fitters and its meshing experiments remain rejected; their measurements and counterexamples stay under `packages/playground/.shots/solo-head-*` and `solo-handoff-final-*`. The [#2973](https://github.com/samchon/automovie/pull/2973) version of this file records them in full. None of them is in the live import graph.
