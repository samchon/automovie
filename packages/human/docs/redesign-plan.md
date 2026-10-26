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
| Breasts | relief on the thorax, tilted direction | breast axis | bust span, chest, underbust, shoulder to apex |
| Buttocks | relief on the pelvis | gluteal chart | hip, high hip |
| Auricles | appendages | helix arc | ear length, breadth, protrusion |
| Eye openings | trims with lids | globe frame | palpebral fissure length and height, intercanthal width |
| Nostrils | trims with pockets | nostril axis | nose width |

Genitals and nipples stay outside the modelled skin. The brow, cheeks and chin are the face base's own shape, fitted to the rows within their error, and change with the face parameters the base reads; they become reliefs only if an inspection round finds a defect only a relief removes. Every frame comes from the source: the head axis and the face landmarks from the reference head's landmark curves, the trunk, limb and digit axes from the reference body's bind skeleton (`body-observations.json`, registered like the meshes). The masculine-feminine basis and the measurement law act on these parameters and on module coefficients (section 6).

## 2. Representations

### Base

A base is a family of sections in its own frame along its axis, stored as key sections only (`IAutoMovieHumanFeatureChain`): periodic cubic B-spline sections of N control points at shape events, interpolated over station by the natural cubic spline of each control point (C2, least `integral f''^2`). N is the fewest that hold the module's tolerance (64 for limbs, 96 to 128 for the head and trunk), not 256. A closed end (the vertex, a digit tip) is a cap whose station is the angle from the pole axis, as in spherical coordinates, so the station map stays regular at the pole and the dome is smooth; a height station would need a square-root profile no spline holds.

### Relief

A relief is a displacement field over a chart of its base: `S(u, v) = B(u, v) + d(u, v) e(u, v)`, with `(u, v)` the base's station and phase restricted to the relief's window, `e` the relief's fixed axis, the direction within 70 degrees of the base's mean normal that maximises the 5th percentile of `n . e` over the feature's observed normals (forward and down for the nose and the breasts), so the whole feature, underside included, is a single height and cannot fold back, and `d` a tensor-product cubic B-spline whose three outer rows of control points are zero (a uniform cubic takes three control points at a knot), so `d` and its first and second derivatives vanish at the window's edge. The sum is C2 wherever the base is. A transformation is an affine map of the window and a gain on `d` (a smaller nose, fuller breasts, a stylised face).

### Appendage

An appendage is a family of sections along its own spine (the helix arc for an auricle, the bone for a limb or digit), stored and interpolated as a base is. Its root boundary meets a trim curve on the base.

### Auricle

The auricle is not a tube: it is a thin flap, front face (concha, antihelix, scapha) and back face, attached to the head along a closed line and curled at its free rim, and a station measured away from the head folds back on itself at the concha. Its representation is decided by one experiment set run on f1 outside the live source before the auricle is built, each variant fitted to the helix, lobe and head rows and compared offline by its surface distance to the rows, the G1 and G2 residuals of its join and the curvature combs of its sections (renders come in the inspection round, after the choice):

1. a ribbon swept along the rim arc whose sections run from the front attachment round the rim to the back attachment, its two long edges forming the root loop;
2. a smooth shell over the ear's footprint, carrying the folds as a relief;
3. a smooth implicit union of a fitted ear surface with the head.

The set runs once, after the head base's final fit, in one process on f1 for both auricles:

- region and root loop: the auricle's region from its landmark curves (section 4), its boundary in the base chart a periodic cubic B-spline least-squares fit with as many control points as hold one chart cell, printed with its anatomical extent before any variant is fitted;
- observations: every saved point that projects into the region and stands off the base by more than the robust scale either way, the concha lying below the base (the head rows, the horizontal exterior helix, lobe and lower families and the tilted lower family), plus one new private family cut through the observation program in the planes normal to the rim arc every 3 mm, the rim arc being the outer helix landmark curve fitted as an open cubic B-spline in space;
- variant 1, ribbon: a tensor-product cubic B-spline surface over (arc parameter along the rim, the section's arc from the front attachment round the rim to the back attachment), fitted to the observations by tangent-distance minimisation with the thin-plate energy, its boundary held on the root loop;
- variant 2, shell and relief: a smooth shell over the region, the height over the base along the auricle's mean normal, fitted stiff (the base's robust fit, the folds outliers), then the folds as a relief of the shell along the axis of section 2's rule;
- variant 3, implicit: a signed distance field fitted to the observations thinned to one per 3 mm cell by the biharmonic radial basis (Carr et al. 2001) with off-surface points 1 mm along the observed normals and smoothing of the rows' error, its union with the head base's offset distance by a smooth union of 2 mm blend radius; its distance to the rows is the first-order estimate `|f| / |grad f|`, and its zero set is sampled by Newton steps from the observations for the join and section measures;
- comparison, recorded in [experiments.md](experiments.md) per auricle and variant: the 50th, 90th and 99th percentile of the observed rows' distance to the surface; the largest position, normal angle and normal curvature jump across the root loop (G0, G1, G2 residuals) sampled every 1 mm; the number of sign changes of curvature along each section's comb outside the anatomical folds' count; and whether the rim's curl is held (no section folds back on itself where the observations do not);
- choice, stated before the set runs: the variant whose 99th percentile distance is within twice the rows' error (0.23 mm) and whose G1 residual is below 1 degree, among those the one with the fewest excess curvature sign changes; if none meets both, the one with the lowest 99th percentile, and the shortfall is reported in the experiments with its cause before the plan changes.

### Openings

An opening is a closed trim curve in its module's chart (eye margins on the face base, nostril margins on the nose relief, the oral line on the lips). Inside, the closure (lids on the globe, nostril pocket) is built from the trim curve and the surface's analytic cross derivative there, not from mesh jets.

## 3. Composition

- **Relief:** added to its base before tessellation; no boundary exists.
- **Appendage to base:** the base is trimmed along the root curve `C(t)` (a curve in its chart); the appendage ends at `A(t)`; a strip `T(t, w) = sum H_i(w) [C, A, D_C, D_A, D2_C, D2_A]_i(t)` with the quintic Hermite basis matches position, cross derivative and second cross derivative of both surfaces (G2). Cross derivatives come from the module surfaces analytically.
- **No contact rings:** a base that carries appendages is closed (the trunk down to the perineum, the palm and the sole at their distal ends), and every appendage roots in a closed loop on it. The axilla is the arm's strip with the trunk under it, the crotch the trunk between the two leg roots, a web the palm between two finger roots, so no junction needs a patch of more than two surfaces and no horizontal contact ring exists anywhere.
- **Tessellation:** each module's chart is sampled adaptively by its own chord tolerance; a base leaves out every grid cell with a corner inside a root loop, and the hole's edge is zipped to the loop by the share of perimeter walked in the chart; boundaries are sampled once by their owner and shared by index, so the mesh is watertight. Shading normals are the analytic surface normals.

Every join is classified before its evaluator is built ([source-domain admission](../../../.agents/skills/human/reverse-analysis.md#source-domain-admission)):

| Join | Class | Construction |
| --- | --- | --- |
| Cranium and face base to neck | regular loft boundary | one shared key section owned by the neck |
| Neck to trunk | regular loft boundary | one shared key section owned by the trunk |
| Trunk to arm | appendage root | closed root loop round the shoulder, G2 strip; the axilla is the strip over the trunk |
| Trunk to legs | appendage roots | closed root loops on the closed trunk, G2 strips; the crotch is the trunk between them |
| Palm to digits, foot to toes | appendage roots | closed root loops on the closed palm and sole, G2 strips; the webs are the base between them |
| Face base to auricle | appendage root | G2 strip along the auricle's attachment |
| Face base to nose and lips; thorax to breasts; pelvis to buttocks | relief | displacement, no boundary |
| Inframammary fold | crease inside a relief | the breast relief's own shape, curving with anatomy |
| Gluteal fold | relief meeting an appendage root | the buttock relief's lower edge meeting the leg's root strip, which runs in the femur's normal plane, not a horizontal ring |
| Eye margins | opening | trim, lids on the globe |
| Nostrils | opening and inferred closure | trim on the nose relief, pocket from the analytic cross derivative |
| Oral line | crease (closed mouth) | the lips relief's contact line; the interior stays with #2971 |

## 4. Fit

The saved Recovery/Hermite rows stay the primary evidence. Where a module's frame is not the rows' (the auricle along its helix, the nose along its dorsum, limbs along their bones), the observation program cuts the reference mesh in the module's planes into an observation file of the same Hermite form, private under `test/.shots/<alias>/`, with its source and plane recorded; the generator never reads it.

An offline fitter per module under `test/src/executable/reference-experiments/human-calibration/` (private, ignored) reads the observations of its region and sets the module's coefficients:

- objective: squared surface distance (Wang, Pottmann and Liu 2006): each surface sample pairs with its nearest observed point in space, and the residual is the offset along the surface normal (tangent-distance minimisation), so any plane of observation and any frame of the module fit alike and rows that graze the skin do not drag it; plus the thin-plate energy `L^4 integral (D_ss^2 + 2 D_st^2 + D_tt^2)` of the correction D from the stage's starting keys (on the coordinates themselves it counts a closed section's own curvature as bending and shrinks it, run A of the [experiments](experiments.md));
- smoothing by the discrepancy principle: the final `L` bisected so the inliers' root mean square offset equals the rows' own error, `0.2 / sqrt(3) = 0.115 mm` (their fitting tolerance is 0.2 mm, an error spread evenly within it), never zero;
- keys added where a station's root mean square offset exceeds that error, no closer to another key than twice the rows' spacing, so each key has observations on both sides;
- strips: each appendage's reach (its strip's fullness) is the value minimising the strip's surface distance to the observations over the strip, a one-dimensional search, not a set constant;
- bases by robust fitting: a base is fitted with Tukey's biweight on the normal residual, its threshold `c = 4.685 s` with `s = 1.4826` times the residuals' median absolute deviation from their median (the standard 95 percent efficiency constant, not a tuned value), from keys smoothed to 4 cycles per section, starting stiff and relaxing its thin-plate length, with its reliefs' windows and its appendages' root regions masked, so those regions stay without data and the base runs under them by its thin-plate energy alone (runs D and E of the [experiments](experiments.md) showed a relaxing base climbing onto an unmasked protrusion from its edges);
- regions from the source's own landmarks, not from thresholds: three detection sets showed that no threshold on a stand-off map holds the features (a symmetric robust fit absorbs them, a baseline sinks into the cranium as it stiffens, and an auricle's concha and scapha break it into pieces, the [experiments](experiments.md)). The reference carries the anatomical definitions instead: landmark curves on the head (`head-observations.json`: the lid margins, the outer and inner helix and the central upper and lower curves of each auricle, the upper and lower outer lip contours, the philtrum, the nostrils, the nasolabial and mentolabial folds, the skull's midline) and measurement courses and the bind skeleton on the body (`body-observations.json`: the Underbust, Bust Span, Hip, Waist, Rise and Neck Base courses, every joint). Each landmark point is projected onto its base (nearest point of a dense sampling, a k-d tree), and each region is a closed curve in the base's chart:
  - lips: the polygon of the upper and lower outer lip contours, both sides;
  - nose: the convex hull of the nasion (the skull midline's least forward point within the lid margins' heights, the deepest point of the nasal bridge in profile), the medial ends of both lid margins, the upper ends of both nasolabial folds (the alar creases) and both nostril outlines;
  - each auricle: the convex hull of its four curves' points, the ear's footprint seen along the base normal, whose boundary is the root loop;
  - each breast: the disc about the Bust Span course's end on that side (the apex) reaching the Underbust course below it;
  - the buttocks: the posterior trunk chart between the Waist course and the leg root regions, either side of the midline;
  - each limb, hand digit and toe: its root loop (below);
  - a relief's window is its region grown by its three zero rings, except where the region borders a root region, where the zero rings lie inside the region instead (the buttocks above the leg roots), so a relief never reaches into a trimmed hole; a base's mask is the union of its reliefs' windows and its appendages' regions;
- each region checked once against the stand-off of the final base: every observed point is projected onto the base (k-d tree) with its signed offset along the base normal, and the observations standing off by more than the robust scale near a feature must lie inside its region; any outside is reported with its distance before the module is built;
- order: bases with their reliefs' and appendages' regions masked, then reliefs as the residual over their base (every observed point projected along the relief's axis onto the base, the outermost per chart cell, since a ray cast from the base crosses a hollow feature's empty inside), each window the feature's region grown by the relief's three zero rings, then appendages, then trims and strips;
- outputs: module coefficients in small TypeScript modules under `packages/human/src/generation/calibration/` with a header naming the fitter, in tens of kilobytes in total; the eye calibration's openings name the face base through `fitEyeCalibration.ts`'s base argument, their margins otherwise reproduced byte for byte from `head-observations.json`.

### Trunk, limbs, hands and feet

- frames: the bind skeleton's joint centres and bone axes. A limb's sections lie in planes normal to its bone axis; across a joint (shoulder to elbow to wrist, hip to knee to ankle, every digit joint) the plane normal turns from one bone's direction to the next's by spherical interpolation over the joint's girth radius either side of its centre, so two planes a station step apart meet at about `2 r / theta` from the axis for a bend `theta`, outside the skin for any bend under two radians;
- observations: the trunk's saved horizontal rows; for each limb a new private family cut from the reference body in its planes every 4 mm (digits and toes every 2 mm) by an explicit-plane form of `observeBodySections.ts`, as the ear observer has, keeping in each plane only the loop around the bone axis;
- root loops: stepping out from the proximal joint centre along the bone axis, the first plane whose loop around the axis stands apart from every other loop of that plane (no longer joined to the trunk, palm or sole) is the appendage's first key; its trim on the parent base is that loop projected along the bone axis onto the base, as an opening's outline is (`AutoMovieHumanBodyRoots.trim`), and the strip between them is the axilla, the groin and gluteal fold, or a web;
- trunk base: horizontal keys from the Neck Base course down to the crotch, closed there by a cap whose pole is the Rise course's lowest point (the perineum), so the leg roots' trims lie on the cap's bowl; masked under the limb root regions and the breast and buttock windows;
- neck base: keys normal to the cervical axis (the bind neck joints to the head joint) from the Neck Base course to the head base's lowest key, sharing both end keys with its neighbours;
- hands and feet: the palm a base from the wrist key to the metacarpal heads, the foot a base from the ankle key to the metatarsal heads, each closed distally by a cap; digits and toes appendages from their root loops to capped tips.

## 5. Generator changes

- New: module evaluators (base, relief, appendage), the composer (root loops and trims, strips, tessellation), and a region naming table that maps modules to the part ids consumers read (`human.skin.head*`, `human.skin.ear.*`, trunk, limbs), so the couplings of the survey change in one place. Head modules keep the `head.<module>` and `ear.<part>.<side>` names the appearance code already reads by prefix; the generation code that named `head.lower`, `head.middle` and `head.upper` reads roles from `AutoMovieHumanBodyNaming` instead, by geometry: the head skin chains in station order, the chain covering a station, the top of the lower face's tilted sections and the auricle chain ending lowest. The roles reproduce the current calibration's values exactly, so the switch to the head base changes no reader.
- Re-derived: the skin texture chart (`AutoMovieHumanSkinChart`) per module chart, reliefs sharing their base's, strips blending their neighbours'.
- Kept: `AutoMovieHumanSplineCurve`, `AutoMovieHumanLoftFrame`, `AutoMovieHumanFeatureChain`, the eye globe and lid profile, the appearance layer, the skeleton (re-pointed to module axes and poles), the public API and types.
- Retired: `AutoMovieHumanSectionLoops`, `AutoMovieHumanContactSmoothing`, `AutoMovieHumanLipSmoothing`, `AutoMovieHumanCornerSmoothing`, `AutoMovieHumanStationContinuity`, `AutoMovieHumanEventJoin`, the event-ring normal blend, the world-height calibration modules and their branch events.

## 6. Shape law

- Basis: per module coefficient (keys, relief control nets, appendage keys), refit by `fitBodyMorph.ts`: every module's fitted surface on f1 is sampled, each sample addressed barycentrically on the f1 reference mesh (its nearest triangle), the same addresses read on f2, m1 and m2 (the four meshes share one vertex order) give each person's samples of that module, the module's coefficients are refitted to them by the same tangent-distance fit starting from f1's, and the basis is each coefficient's change over the masculine-feminine coordinate, stored on a coarse spline as now; the law and the basis move a network's keys and reliefs before expansion, never its expanded layers.
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
| Line under the chin | tilted rows advancing unevenly | fair face base keys fitted to every head row; neck shared key | face base, neck |
| Forehead and thigh striations | phase noise of 256-point rows | fair keys of fewer control points, tolerance-matched thin-plate fit | every base |
| Abdominal band, armpit lump (#2985) | trunk rows and the axillary ring | fair trunk base; arm appendage root loop and strip | trunk, arms |
| Horizontal gluteal fold, thigh line at the crotch (#2985) | horizontal contact ring | buttocks relief with its curving fold; leg root loops and strips on the closed trunk | trunk, buttocks, legs |
| Bob fringe saw edge (#2987) | every card ends at the level cut with a 4 percent jitter and a pointed tip | card length from a smooth length field over the scalp: the per-root jitter removed, the lock variation kept, and a bob's cut level moved by quintic-faded value noise (C2) of 3 mm around the head; a rounded tip band, the card's half width `sqrt(1 - x^2)` of its share `x` of the tip band, sampled every 2 mm there | hair |
| Back highlight strip (#2987) | hanging cards share the capsule normal | card shading normals from a smooth offset surface of the head, the hair mass's own envelope: a radial function over directions from the head chart's centre, a sum of spherical Gaussians about a Fibonacci lattice fitted as an upper expectile (asymmetric least squares) to the draped head above the menton and the hanging column below it, so it is smooth at every direction, poles included, runs over the head instead of through it without a clamp, and its normal `d - grad f / f` is analytic | hair |
| Standing strands above the ears (#2987) | the drape rule steps strands out over the auricle and the projection jumps | strands lie at a clearance over that envelope, which passes over the auricle smoothly, so the projection no longer jumps | hair, auricles |
| Shape-law residuals | landmarks moved by the face stretch | landmarks read on module frames, which the law's maps do not move | law, face base |
| Feminine skin not milky (user goal) | tone not driven by the masculine-feminine control | tone driven by that control with the pigmentation inputs | skin appearance |

## 8. Implementation order inside the one pass

The pass starts when the auricle set has chosen its variant and recorded it here, and a self-review round of this whole plan finds nothing. Before that only experiments and fits run, outside `packages/human/src`.

1. Module evaluators and the composer, with the head (cranium and face base, nose and lips reliefs, auricle appendages, eye and nostril openings) and the trunk with its limbs, hands and feet.
2. The observation program's explicit-plane form for the body and the new private families (limbs, digits, toes, auricle rims); fitters for every module; fitted coefficients for f1.
3. Basis refit for f2, m1, m2; law re-pointed.
4. Consumers re-pointed through the naming table; repair rules and world-height modules removed.
5. Type check with the lint cache disabled; Node generation of all four people.

Done ahead of the pass, against the work order, and kept as part of its result: the milky skin and the hair changes of section 7 (`77b40b5b6a`), which the inspection round judges with the rest; render audits from AUDIT27 on already show grey blotches over the back and top of the hair. The naming table of section 5 waits as a patch for step 4.

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
