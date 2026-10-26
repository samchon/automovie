# Human redesign plan

Plan for [#2993](https://github.com/samchon/automovie/issues/2993), built on [survey.md](survey.md). The skin is composed from anatomical modules whose smoothness follows from their formulas; nothing is smoothed after a fit. It replaces the world-height section stack, its five repair rules and the layer-indexed basis.

It is step 2 of the Human skill's [work order](../../../.agents/skills/human/SKILL.md#work-order): no code changes before it is complete, then section 8 in one pass, then the rounds of section 9 until section 10 holds, each round's findings added here grouped by cause.

## 1. Modules

Every anatomical part is a module with its own frame, parameters, feature curves, construction and fit. A composer joins modules by the rules of section 3. A module owns its shape; a boundary shared by two modules has exactly one owner and both consume it.

| Module | Kind | Frame | Parameters it reads |
| --- | --- | --- | --- |
| Cranium and face mass | base | head axis (atlas to vertex) | head length, cephalic index, height, face height and width, mandibular and minimum frontal width |
| Neck | base | cervical axis | neck girth, neck length, neck base |
| Trunk (thorax, abdomen, pelvis) | base | spinal axis | chest, underbust, waist, high hip, hip, neck-to-waist, across shoulder, front interscye |
| Arm (upper arm, forearm) | appendage | humerus and forearm axes | upper and lower arm length, biceps, elbow, forearm, wrist |
| Hand (palm) and digits | base and appendages | metacarpal and phalanx axes | hand circumference, extremity dimensions |
| Leg (thigh, shank) | appendage | femur and tibia axes | inseam, thigh, knee, calf |
| Foot and toes | base and appendages | foot axis, toe axes | extremity dimensions |
| Nose | relief on the face | nasal dorsum axis | nose width, height, protrusion |
| Lips | relief on the face | mouth axis | mouth width, upper and lower vermilion height |
| Brow, cheeks, chin | relief on the face | face chart | face widths and height |
| Breasts | relief on the thorax, tilted direction | breast axis | bust span, chest, underbust, shoulder to apex |
| Buttocks | relief on the pelvis | gluteal chart | hip, high hip |
| Auricles | appendages | helix arc | ear length, breadth, protrusion |
| Eye openings | trims with lids | globe frame | palpebral fissure length and height, intercanthal width |
| Nostrils | trims with pockets | nostril axis | nose width |

Genitals and nipples stay outside the modelled skin. The masculine-feminine basis and the measurement law act on these parameters and on module coefficients (section 6).

## 2. Representations

### Base

A base is a family of sections in its own frame along its axis, stored as key sections only (`IAutoMovieHumanFeatureChain`): periodic cubic B-spline sections of N control points at shape events, interpolated over station by the natural cubic spline of each control point (C2, least `integral f''^2`). N is the fewest that hold the module's tolerance (64 for limbs, 96 to 128 for the head and trunk), not 256. A closed end (the vertex, a digit tip) is a cap whose station is the angle from the pole axis, as in spherical coordinates, so the station map stays regular at the pole and the dome is smooth; a height station would need a square-root profile no spline holds.

### Relief

A relief is a displacement field over a chart of its base: `S(u, v) = B(u, v) + d(u, v) e(u, v)`, with `(u, v)` the base's station and phase restricted to the relief's window, `e` the base normal tilted toward the relief's own direction (forward-down for the nose and breasts, so their undersides are not undercut), and `d` a tensor-product cubic B-spline whose two outer rows of control points are zero, so `d` and its first and second derivatives vanish at the window's edge. The sum is C2 wherever the base is. A transformation is an affine map of the window and a gain on `d` (a smaller nose, fuller breasts, a stylised face).

### Appendage

An appendage is a family of sections along its own spine (the helix arc for an auricle, the bone for a limb or digit), stored and interpolated as a base is. Its root boundary meets a trim curve on the base.

### Openings

An opening is a closed trim curve in its module's chart (eye margins on the face base, nostril margins on the nose relief, the oral line on the lips). Inside, the closure (lids on the globe, nostril pocket) is built from the trim curve and the surface's analytic cross derivative there, not from mesh jets.

## 3. Composition

- **Relief:** added to its base before tessellation; no boundary exists.
- **Appendage to base:** the base is trimmed along the root curve `C(t)` (a curve in its chart); the appendage ends at `A(t)`; a strip `T(t, w) = sum H_i(w) [C, A, D_C, D_A, D2_C, D2_A]_i(t)` with the quintic Hermite basis matches position, cross derivative and second cross derivative of both surfaces (G2). Cross derivatives come from the module surfaces analytically.
- **No contact rings:** a base that carries appendages is closed (the trunk down to the perineum, the palm and the sole at their distal ends), and every appendage roots in a closed loop on it. The axilla is the arm's strip with the trunk under it, the crotch the trunk between the two leg roots, a web the palm between two finger roots, so no junction needs a patch of more than two surfaces and no horizontal contact ring exists anywhere.
- **Tessellation:** each module's chart is sampled adaptively by its own chord tolerance; a trimmed chart is triangulated in its parameter domain under the trim curve as a constraint; boundaries are sampled once by their owner and shared by index, so the mesh is watertight. Shading normals are the analytic surface normals.

Every join is classified before its evaluator is built ([source-domain admission](../../../.agents/skills/human/reverse-analysis.md#source-domain-admission)):

| Join | Class | Construction |
| --- | --- | --- |
| Cranium and face base to neck | regular loft boundary | one shared key section owned by the neck |
| Neck to trunk | regular loft boundary | one shared key section owned by the trunk |
| Trunk to arm | appendage root | closed root loop round the shoulder, G2 strip; the axilla is the strip over the trunk |
| Trunk to legs | appendage roots | closed root loops on the closed trunk, G2 strips; the crotch is the trunk between them |
| Palm to digits, foot to toes | appendage roots | closed root loops on the closed palm and sole, G2 strips; the webs are the base between them |
| Face base to auricle | appendage root | G2 strip along the auricle's attachment |
| Face base to nose, lips, brow, cheeks, chin; thorax to breasts; pelvis to buttocks | relief | displacement, no boundary |
| Gluteal and inframammary folds | crease inside a relief | the relief's own shape, curving with anatomy |
| Eye margins | opening | trim, lids on the globe |
| Nostrils | opening and inferred closure | trim on the nose relief, pocket from the analytic cross derivative |
| Oral line | crease (closed mouth) | the lips relief's contact line; the interior stays with #2971 |

## 4. Fit

The saved Recovery/Hermite rows stay the primary evidence. Where a module's frame is not the rows' (the auricle along its helix, the nose along its dorsum, limbs along their bones), the observation program cuts the reference mesh in the module's planes into an observation file of the same Hermite form, private under `test/.shots/<alias>/`, with its source and plane recorded; the generator never reads it.

An offline fitter per module under `test/src/executable/reference-experiments/human-calibration/` (private, ignored) reads the observations of its region and sets the module's coefficients:

- objective: squared surface distance (Wang, Pottmann and Liu 2006, the in-plane miss weighted by `|N . n|`) plus the thin-plate energy `L^4 integral (S_ss^2 + 2 S_st^2 + S_tt^2)`;
- smoothing by the discrepancy principle: `L` bisected so the residual's root mean square equals the rows' own tolerance (0.1 to 0.2 mm), never zero;
- keys added where a station's residual exceeds the tolerance, no closer than a least gap;
- windows and roots: each relief's window, each appendage's root curve and each opening's margin are found from anatomical landmarks on the observations ([anatomy](anatomy/) and the head curve identification techniques: nasion, alar crease, subnasale, commissures, the auricle's attachment line, the inframammary and gluteal folds), never from hand-placed coordinates;
- order: bases with their reliefs' and appendages' regions masked, then reliefs as the residual over their base, then appendages, then trims and strips;
- outputs: module coefficients in small TypeScript modules under `packages/human/src/generation/calibration/` with a header naming the fitter, in tens of kilobytes in total.

## 5. Generator changes

- New: module evaluators (base, relief, appendage), the composer (root loops and trims, strips, tessellation), and a region naming table that maps modules to the part ids consumers read (`human.skin.head*`, `human.skin.ear.*`, trunk, limbs), so the couplings of the survey change in one place.
- Re-derived: the skin texture chart (`AutoMovieHumanSkinChart`) per module chart, reliefs sharing their base's, strips blending their neighbours'.
- Kept: `AutoMovieHumanSplineCurve`, `AutoMovieHumanLoftFrame`, `AutoMovieHumanFeatureChain`, the eye globe and lid profile, the appearance layer, the skeleton (re-pointed to module axes and poles), the public API and types.
- Retired: `AutoMovieHumanSectionLoops`, `AutoMovieHumanContactSmoothing`, `AutoMovieHumanLipSmoothing`, `AutoMovieHumanCornerSmoothing`, `AutoMovieHumanStationContinuity`, `AutoMovieHumanEventJoin`, the event-ring normal blend, the world-height calibration modules and their branch events.

## 6. Shape law

- Basis: per module coefficient (keys, relief control nets, appendage keys), refit by `fitBodyMorph.ts` over the four meshes at barycentric addresses of the module surfaces; stored on a coarse spline as now.
- Measurement law: girths and lengths read on module sections by named landmarks (module-relative stations), applied as the module's own scale maps; carried modules move rigidly with their parents' maps at their roots, as now.
- Head parameters now consumed: nose, lips, auricles and eye openings take their inputs as transformations of their modules.
- Skin appearance: a feminine body's base albedo reads milky (lighter, cooler, a softer subsurface tint), driven in `AutoMovieHumanSkinTone` by the `masculineFeminine` control together with the existing pigmentation inputs, never by a person's alias.

## 7. Defects to changes

Every open defect of the [survey](survey.md#open-defects-and-their-causes) and the change that removes its cause:

| Defect | Cause | Change | Modules affected |
| --- | --- | --- | --- |
| Canthus ledge, eye-height line (#2978) | missing head rows; one section per height across the eye; folds at the canthus | cranium and face base fitted to every head row, the closed horizontal rows included, as fair keys; the eye is a trim, not a fold of the sections | face base, eye openings |
| Canthus open past the globe, lid teeth (#2979) | bridged loft cut by position; margin columns read mesh jets | eye opening as a trim curve in the base chart; lids from the analytic cross derivative | face base, eye openings, lids |
| Auricle stairs, ripples, helix-root trace, rim and lobe joins (#2984) | auricle inside the head's sections and 0.1 mm chains | auricle appendage along its helix, G2 strip to the face base | auricles, face base |
| Lip notches, commissure patch (#2980) | tilted rows ringing; oral line across layers | lips relief over the face base with the oral line as its contact crease | lips, face base |
| Rough nostril rims (#2983) | cut edge of a bridged loft; pocket without matching derivatives | nostril trims on the nose relief; pocket from the analytic cross derivative | nose, nostrils |
| Line under the chin | tilted rows advancing unevenly | chin relief over a fair face base; neck shared key | face base, chin, neck |
| Forehead and thigh striations | phase noise of 256-point rows | fair keys of fewer control points, tolerance-matched thin-plate fit | every base |
| Abdominal band, armpit lump (#2985) | trunk rows and the axillary ring | fair trunk base; arm appendage root loop and strip | trunk, arms |
| Horizontal gluteal fold, thigh line at the crotch (#2985) | horizontal contact ring | buttocks relief with its curving fold; leg root loops and strips on the closed trunk | trunk, buttocks, legs |
| Bob fringe saw edge (#2987) | every card ends at the level cut with a 4 percent jitter and a pointed tip | card length from a smooth length field over the scalp (C1 noise of a few millimetres about the cut) and a rounded tip band | hair |
| Back highlight strip (#2987) | hanging cards share the capsule normal | card shading normals from a smooth offset surface of the head, the hair mass's own envelope | hair |
| Standing strands above the ears (#2987) | the drape rule steps strands out over the auricle and the projection jumps | strands follow the offset envelope of the composed head, which passes over the auricle appendage smoothly | hair, auricles |
| Shape-law residuals | landmarks moved by the face stretch | landmarks read on module frames, which the law's maps do not move | law, face base |
| Feminine skin not milky (user goal) | tone not driven by the masculine-feminine control | tone driven by that control with the pigmentation inputs | skin appearance |

## 8. Implementation order inside the one pass

1. Module evaluators and the composer, with the head (cranium and face base, nose and lips reliefs, auricle appendages, eye and nostril openings) and the trunk with its limbs, hands and feet.
2. Fitters for every module; fitted coefficients for f1.
3. Basis refit for f2, m1, m2; law re-pointed.
4. Consumers re-pointed through the naming table; repair rules and world-height modules removed.
5. Type check with the lint cache disabled; Node generation of all four people.

## 9. Inspection round

All four people, after the pass and after every fix batch, saved under `packages/playground/.shots/<round>/` with receipts:

- whole body front, side, back, top, both obliques, in surface (default material and clay), overlay and construction;
- head front, side, back, oblique; both eyes; the face from 50 degrees; underside of nose and chin; each auricle close and from behind; the mouth at both commissures; all in clay under both raking lights and in colour;
- axillae, crotch, gluteal fold, inframammary fold, hands and feet close in clay under raking light;
- the same frames as the reference photographs (`test/.shots/<alias>/screenshots-corrected/`, whole, head and tiles) under the reference conditions, side by side;
- curve diagrams with curvature combs and station series across every module boundary and strip;
- measurements: per-module surface distance to the observations, G1 and G2 residuals across every strip, shape-law input against generated measure for every consumed parameter;
- f1 audit set every 15 minutes during the round.

## 10. Acceptance

- No line, shelf, ripple, stair step or crease under raking light that the reference photographs lack, for all four people.
- Every module boundary continuous in position, tangent plane and curvature to its measured residual.
- Surface distance within the observations' tolerance outside openings.
- Calibration modules an order of magnitude smaller; `packages/human` build time with them.
- Generation of one person no slower than now (about 15 s in Node on this machine).
- Public API, `IAutoMovieHumanParameters` and `IAutoMovieHumanGenerated` unchanged; Human and Human-viewer tests neither written nor run.
