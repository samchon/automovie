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

Seen in `campaign-r3` and `campaign-r4` and traced as below; the first three need the head fitter's correspondence rather than another runtime rule.

| Defect | Traced cause |
| --- | --- |
| A thin fin in front of each helix top and stair steps across the auricle | The auricle lies in the middle head's sections, whose outline changes quickly with height, and the upper head's first band joins equal phases that slide 13 mm along the section over 0.8 mm of station; the section family itself is smooth. Splitting such bands (tried) multiplied generation time by five and left the fin |
| A ledge beside each lateral canthus | The upper-lid fold continues about 6 mm past the canthus as a 1.5 to 3 mm step in the fitted sections, smooth along the station, so the corner low-pass leaves it; the eye fitter would have to end the fold |
| Dark stripes inside the nostrils in clay and stair steps on the right rim | The pocket's inferred meridians and the cut edge; in colour the cavity tint darkens the interior |
| The gluteal fold stays a horizontal crease | The crotch is a horizontal contact ring; a fold rising toward the hips needs a tilted or curved contact |
| A white highlight at the left commissure and a dark line past the right one in colour | The oral line's ridge continues 10 to 22 mm onto the cheek at 0.2 to 0.35 per mm curvature in smooth, not noisy, layers |
| Bob ends flare at the shoulders | Resting strands descend the shoulder surface outward, and the tip band narrows to points |
| Shape-law residuals | Neck length -6 to -8 percent on m1 and m2 and +11 percent on f2, and m2's mandibular width +20 percent, read at landmarks the face stretch itself moves; the bust span is not measurable on a flat chest |

## Evidence

Local captures are under `packages/playground/.shots/`: periodic audits `claude-audit-001` onward, inspections `claude-inspect-r1` through `claude-inspect-r7` and `campaign-r0` through `campaign-r3`. Frames that returned 500 while the worker page reloaded between people were captured again.

## Earlier work

The checkpoint's off-live head reconstruction, its fitters and its meshing experiments remain rejected; their measurements and counterexamples stay under `packages/playground/.shots/solo-head-*` and `solo-handoff-final-*`. The [#2973](https://github.com/samchon/automovie/pull/2973) version of this file records them in full. None of them is in the live import graph.
