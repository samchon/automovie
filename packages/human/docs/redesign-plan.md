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

A relief is a displacement field over a chart of its base: `S(u, v) = B(u, v) + d(u, v) e(u, v)`, with `(u, v)` the base's station and phase restricted to the relief's window, `e` the relief's fixed axis, the direction within 70 degrees of the base's mean normal that maximises the 5th percentile of `n . e` over the feature's observed normals (forward and down for the nose and the breasts), so the whole feature, underside included, is a single height and cannot fold back, and `d` a tensor-product cubic B-spline whose three outer rows of control points are zero (a uniform cubic takes three control points at a knot), so `d` and its first and second derivatives vanish at the window's edge. The sum is C2 wherever the base is. A transformation is an affine map of the window and a gain on `d` (a smaller nose, fuller breasts, a stylised face).

### Appendage

An appendage is a family of sections along its own spine (the helix arc for an auricle, the bone for a limb or digit), stored and interpolated as a base is. Its root boundary meets a trim curve on the base.

### Auricle

The auricle is not a tube: it is a thin flap, front face (concha, antihelix, scapha) and back face, attached to the head along a closed line and curled at its free rim, and a station measured away from the head folds back on itself at the concha. Its representation is decided by one experiment set run on f1 outside the live source before the auricle is built, each variant fitted to the helix, lobe and head rows and compared offline by its surface distance to the rows, the G1 and G2 residuals of its join and the curvature combs of its sections (renders come in the inspection round, after the choice):

1. a ribbon swept along the rim arc whose sections run from the front attachment round the rim to the back attachment, its two long edges forming the root loop;
2. a smooth shell over the ear's footprint, carrying the folds as a relief;
3. a smooth implicit union of a fitted ear surface with the head.

The set runs once, after the head base's final fit, in one process on f1 for both auricles:

- region and root loop: the auricle's feature union of the head base fit, its outer boundary in the base chart a closed curve (a periodic cubic B-spline least-squares fit of the boundary cells' centres, as many control points as hold the cell size), checked against the attachment line (the cephalo-auricular groove behind, the helix root and the tragus in front, the lobe's lowest attachment below) before any variant is fitted;
- observations: every saved point that projects into the region and stands off the base by more than the robust scale either way, the concha lying below the base (the head rows, the horizontal exterior helix, lobe and lower families and the tilted lower family), plus one new private family cut through the observation program in the planes normal to the rim arc every 3 mm, the rim arc being the observed points of largest stand-off per 5 degree sector about the region's centroid in the base chart, fitted as an open cubic B-spline in space;
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
| Face base to nose, lips, brow, cheeks, chin; thorax to breasts; pelvis to buttocks | relief | displacement, no boundary |
| Gluteal and inframammary folds | crease inside a relief | the relief's own shape, curving with anatomy |
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
- bases by robust fitting: a base is fitted with Tukey's biweight on the normal residual, its threshold `c = 4.685 s` with `s = 1.4826 MAD` the robust scale of the current residuals (the standard 95 percent efficiency constant, not a tuned value), starting stiff and relaxing its thin-plate length, so a protrusion the base cannot follow (an auricle, the nose, the lips) becomes an outlier and the base runs smoothly under it;
- the stiff stage as a baseline under the features: a symmetric robust fit climbs onto every protrusion until what remains stands about its threshold over it, and starting keys that carry the features hold them through the energy on the correction (the second protrusion set of the [experiments](experiments.md)). So the stiff stage starts from keys free of features, the sections smoothed to 4 cycles and every control coordinate then smoothed over station by the Whittaker smoother (Eilers 2003) of the stage's thin-plate length, and is fitted by asymmetric least squares (Eilers and Boelens 2005, baseline correction): observations outside the base weigh `p = 0.01` and those inside `1 - p` (the middle of their recommended 0.001 to 0.1), so the base rests on the skin from inside and passes under every protrusion narrower than its stiffness, at a constant offset below the skin, the residuals' median, which the stand-off subtracts. The robust scale is `1.4826` times the residuals' median absolute deviation from their median;
- protrusions detected once and kept out: on the stiff stage, every observed point is projected onto its nearest point of the base (a k-d tree over a dense sampling of the base) and its signed offset along the base normal is its height; a chart cell's stand-off is the largest height projected into it. A hollow feature (the nose, an auricle) has observations only on its outer skin, which project onto the base under it at their true height, while skin that grazes the base (the throat under the chin) projects beside itself near zero; rays cast from the base could do neither (the protrusion set of the [experiments](experiments.md)). Protrusions are the watershed basins of cores above `c`, cells joined while the height falls away and stays above `s`, merged across a saddle when the lower basin's peak stands less than `c` above it (its dynamic, the standard remedy for watershed over-segmentation); a feature is the union of the basins classified to it. Those regions stay without data while the base relaxes; runs D and E of the experiments showed a relaxing base climbing onto a protrusion from its edges otherwise;
- detection scale by one planned set: under a baseline the stiffness alone sets what passes under, so the third set runs, in one process on f1, stiff lengths of 20, 40, 60 and 80 mm, and records each variant's features and peaks. Classes relative to eye level: the nose in front within 25 mm of the midline from 10 mm above to 60 mm below (the nasion lies about at eye level), the lips in front within 35 mm from 55 to 85 mm below, each auricle more than 55 mm lateral from 55 mm below to 15 mm above. The rule chosen before it runs is convergence: take the least stiff variant in which the nose, each auricle and the lips are each one connected union and whose peaks no stiffer variant raises by more than `s`. Any further region becomes a relief of the brow, cheek and chin module or is reported;
- windows and roots from the regions: each relief's window and each appendage's root loop is the boundary of its protrusion region, checked against anatomical landmarks ([anatomy](anatomy/) and the head curve identification techniques: nasion, alar crease, subnasale, commissures, the auricle's attachment line, the inframammary and gluteal folds), never from hand-placed coordinates;
- order: bases with their reliefs' and appendages' regions masked, then reliefs as the residual over their base (every observed point projected along the relief's axis onto the base, the outermost per chart cell, since a ray cast from the base crosses a hollow feature's empty inside), each window the feature's region grown by the relief's three zero rings, then appendages, then trims and strips;
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
| Bob fringe saw edge (#2987) | every card ends at the level cut with a 4 percent jitter and a pointed tip | card length from a smooth length field over the scalp: the per-root jitter removed, the lock variation kept, and a bob's cut level moved by quintic-faded value noise (C2) of 3 mm around the head; a rounded tip band, the card's half width `sqrt(1 - x^2)` of its share `x` of the tip band, sampled every 2 mm there | hair |
| Back highlight strip (#2987) | hanging cards share the capsule normal | card shading normals from a smooth offset surface of the head, the hair mass's own envelope: a radial function over directions from the head chart's centre, a sum of spherical Gaussians about a Fibonacci lattice fitted as an upper expectile (asymmetric least squares) to the draped head above the menton and the hanging column below it, so it is smooth at every direction, poles included, runs over the head instead of through it without a clamp, and its normal `d - grad f / f` is analytic | hair |
| Standing strands above the ears (#2987) | the drape rule steps strands out over the auricle and the projection jumps | strands lie at a clearance over that envelope, which passes over the auricle smoothly, so the projection no longer jumps | hair, auricles |
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
