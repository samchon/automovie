# Surface composition

How the skin's parts combine. Every part is smooth by its own construction, and every combination is smooth by a formula; nothing is smoothed after the fact.

## Limit of one section per height

A horizontal section through the head at ear height holds the cranium, the face and both auricles in one closed curve. Where a feature protrudes, the curve turns sharply concave and, as the auricle detaches behind the helix, folds onto itself; the phase correspondence between neighbouring heights then slides, and a chain branch is needed where the helices leave. A feature spread over tens of layers also cannot be transformed on its own: the nose cannot be lengthened or the ears resized without rewriting every layer they cross.

## Parts are modules

Each anatomical part (the cranium and face mass, the nose, each auricle, the thorax, each breast, each limb) is a module with:

- its own frame: the nasal dorsum's axis for the nose, the helix's arc for the auricle, the breast's axis for the breast, the bone for a limb;
- its own parameters (nasal length, projection and width; breast volume and ptosis; auricle size and angle), the handles any transformation, including a stylised one, acts on;
- its own feature curves and lofting sections, taken in its own frame rather than as world-height slices through the whole head or trunk;
- its own fit to the observations of its region.

A composer joins the modules by the two rules below, so changing one module (a smaller nose, larger ears) touches nothing else.

## Two kinds of part

The deciding property is whether a feature can be written as a height over the surface under it.

1. **Relief** (nose, lips, brow, cheekbones, chin, breasts, buttocks, muscle masses): every point of the feature lies along the base surface's normal from exactly one base point. It is a displacement field `d(u, v)` over a chart of the base, so the skin is `S(u, v) = B(u, v) + d(u, v) n_B(u, v)`. With a C2 base and a C2 field the skin is C2 with no seam. The field is a tensor-product spline over the feature's chart, or a sum of compactly supported C2 bumps, vanishing with its first and second derivatives at the chart's edge. Its amplitude and shape parameters are the handles of a transformation (a smaller nose, fuller breasts, an exaggerated style).
2. **Appendage** (auricle, neck on the head, limbs on the trunk, fingers on the hand, toes on the foot): the feature overhangs the base or changes its topology, so no height field over the base describes it. It is a surface with its own parameterisation: a sweep of sections along its own spine, such as the helix rim along its arc or a limb along its bone. It meets the base along a root curve, and a transition strip joins the two.

A relief that grows into an overhang (a large breast's inframammary fold) tilts its displacement direction before it becomes an appendage.

## Transition strips

Between an appendage's root boundary `A(t)` and the matching curve `C(t)` on the base, the strip is the Hermite blend in its cross parameter `w` from 0 to 1:

`T(t, w) = H0(w) C(t) + H1(w) A(t) + H2(w) D_C(t) + H3(w) D_A(t)`

with `D_C` and `D_A` the cross-boundary derivatives of the two surfaces (scaled to the strip's width) and `H0..H3` the cubic Hermite basis, or the quintic basis with the second cross derivatives as well. Matching the cross derivatives gives tangent-plane continuity (G1) along both edges; the quintic form gives curvature continuity (G2), which removes a visible line under raking light. This is the Coons-type construction of CAD fillets.

A base that carries appendages is closed (the trunk down to the perineum, the palm and the sole at their distal ends) and every appendage roots in a closed loop on it, so the axilla is the arm's strip over the trunk, the crotch the trunk between the leg roots and a web the palm between two finger roots: no junction joins more than two surfaces.

The smooth union of implicit surfaces (convolution surfaces along a skeleton) is an alternative for joints: it blends tubes into one another without explicit strips at the cost of the explicit parameterisation.

## Dividing a part

- Split a part only at named anatomical loci: a branch level, a published measurement site, a midline or surface reference line, a compartment boundary, a fold. Split as finely as gives each piece one curvature sign and one monotone run of curvature between its boundaries, and stop where the next boundary would have no named locus.
- Draw a tube's guides first, longitudinal curves at fixed phases from the inputs, and fill each sector between two guides. A sector owns a whole number of its section spline's knot spans, at least four (see Sectors and guides), so the ring stays one chain section every consumer reads unchanged.
- An owner publishes a seam's jet by arclength (position, tangent, curvature) with the seam's declared continuity, and the mixed derivative at every corner; the neighbour converts it to its own parameter and copies it.
- Close a junction where more than two pieces meet by a transfinite patch over the published ribbons, and carry a local feature as a relief window.
- Check each seam from the declared seam list: gap, tangent break and normal-curvature jump against its declared continuity, read in the plane normal to the seam's tangent.

## Seams

Every join between pieces goes through the shared seam module in `src/lofting/`: `IAutoMovieHumanSeam` (the declaration), `AutoMovieHumanSeam` (curve and surface jets, ribbons, reflection, measurement), `AutoMovieHumanSeamKnot` (knot jets and sector assembly) and `AutoMovieHumanSeamStation` (the station rule and the copy of a shared layer). The JSDoc there holds the formulas.

A seam is data, `{ name, owner, neighbour, curve, continuity }` with continuity G0, G1 or G2. The owner evaluates the shared curve and publishes its jet; the neighbour converts the jet to its own parameter and copies it; a piece never invents its own side of a seam or fades a mismatch.

| Rule | What the owner publishes | What the neighbour writes |
| --- | --- | --- |
| J1 curve | `(p, T, kappa N)` by arclength (`AutoMovieHumanSeam.publish`) | `q_v = lambda T`, `q_vv = lambda^2 kappa N + mu T` at its own speed `lambda` and acceleration `mu` (`adopt`) |
| J2 section knot | a guide's J1 jet at a knot | the three control points about the knot (`AutoMovieHumanSeamKnot.controls`, `assemble`) |
| J3 layer | its end layer with first and second station derivatives | the copy, signed into its own station direction (`AutoMovieHumanSeamStation.copy`), kept through the C2 solve (`continuous`) |
| J4 surface ribbon | its 2-jet at the seam: `c'`, `c''`, `D1`, `D2`, `d_t D1` | `q_w = alpha D1 + beta c'` (G1, `alpha > 0`), `q_ww = alpha^2 D2 + 2 alpha beta d_t D1 + beta^2 c''` (G2) (`ribbon`) |
| J5 corner | the mixed derivative (`twist`) | the same twist, so valence-4 points in tensor arrangement close by construction |
| J6 reflection | the canonical side | every vector mirrored, `along` and `twist` negated (`reflect`) |
| J7 relief | nothing: height, slope and curvature vanish at the window's edge | nothing |
| J8 observation | the declaration | gap, normal angle and normal-curvature jump on the emitted skin in the plane normal to the seam's tangent (`test/src/features/internal/HumanSeamObserver.ts`) |

The existing joins already sit on it. `AutoMovieHumanFeatureChain`'s shared ends are J3 copies and its natural spline is the station rule; `AutoMovieHumanBodyStrip`'s edge rows are J1 copies at the edge speed `l` (a J4 ribbon with `beta = 0` on each edge); `AutoMovieHumanEventJoin` re-slopes a child by the J4 G1 defect `N . (D_p - D_c)`; the web's columns away from a crest are the cubic Hermite between two J1 copies.

The appendage strip's base edge leaves its root loop square to the loop on the skin: the loop's chart tangent turned in the chart is made square in the base's first fundamental form (`AutoMovieHumanSeam.square`, J4 with `alpha = 1`). Turned in the chart alone, where phase runs in radians and station in mm, it stands far off square and swings sharply near the loop's station extremes.

A junction where more than two pieces meet (a web, the axilla, the groin, a digit root) closes by `AutoMovieHumanSeamPatch`: four sides, each a J4 ribbon of the owner across that side (`side`), joined by the Hermite boolean sum of order 1 (G1) or 2 (G2). Corner entries come from the owners' mixed derivatives (J5); where two sides disagree, each entry is Gregory-blended, so every side is still met to its declared order and only the corner point itself is singular. `create` reports each corner's gap, first-order and twist disagreement; the two owners close a twist disagreement by publishing one twist.

Along a chain the station rule is the natural cubic spline of every coefficient, carried as each layer's slopes and curvatures so its intervals take the quintic rule (`continuous`). Three-point slopes (`AutoMovieHumanHorizontalChain.build`, used by the head, neck and shoulder chains) leave a curvature step at every layer; the step is `r''(y+) - r''(y-)` of the cubic Hermite's ends.

## Sectors and guides

A guide is a longitudinal landmark curve at a fixed phase; it owns its point, tangent and curvature in every section it crosses, and the sector between two guides is filled by its own rule.

A chain section is a uniform periodic cubic B-spline. At a knot of spacing `h` the curve depends on the three control points about it alone:

```text
p   = (P- + 4 P0 + P+) / 6
p'  = (P+ - P-) / (2 h)
p'' = (P- - 2 P0 + P+) / h^2
```

because the uniform cubic basis at a knot weighs `1/6, 4/6, 1/6`, its derivative `-1/2, 0, 1/2` over `h` and its second derivative `1, -2, 1` over `h^2`. The map is invertible: `P0 = p - h^2 p'' / 6` and `P+- = p + h^2 p'' / 3 +- h p'`. So a guide at a knot owns its jet exactly by writing three control points, and no other control point changes it. `AutoMovieHumanSplineCurve.interpolate` cannot do this: its inverse filter makes every control point depend on every sample, so a guide's curvature is whatever the whole ring gives it.

A sector between guide knots `g` and `g + k` has the control points `g + 2 .. g + k - 2` of its own, `k - 3` of them, since `g + 1` and `g + k - 1` belong to the guides. With three spans a sector has none and is wholly the guides' blend; with four it keeps one control point and so a shape of its own; that is why a sector takes at least four spans. Its own control points are `p - h^2 p'' / 6` of its curve at its knots, which reproduces the curve exactly when the curve is a cubic spline on those knots and is otherwise its fourth-order quasi-interpolant. The ring stays one chain section every consumer reads unchanged.

Reference lines that bound sectors (Gray 1918, ISO 8559-1):

- Trunk: front midline M, rectus or sternal edge R, mid-clavicular or bust line K, mid-axillary line L at the widest point, scapular or erector edge E, back midline S.
- Arm: deltoid span with anterior, middle and posterior heads; upper arm with biceps, medial neurovascular groove, triceps and lateral intermuscular septum; elbow with olecranon, medial and lateral epicondyles and cubital fossa; forearm with the brachioradialis ridge, flexor mass, extensor mass and subcutaneous ulnar border; wrist with dorsal, radial (styloid), palmar and ulnar (styloid) sides.
- Leg: thigh with anterior (rectus femoris), anteromedial (vastus medialis), medial (adductors, sartorius), posterior (hamstrings) and lateral (iliotibial band); knee with patella, femoral condyles and popliteal fossa; calf with the subcutaneous medial tibial face (its crest the anterior edge), tibialis anterior, peroneals and the two gastrocnemius heads over the soleus; the Achilles tendon above the malleoli.
- Hand and foot: dorsal and palmar or plantar halves meeting at side points that own the tightest turn; on the foot the dorsal crest, plantar midline and medial and lateral borders.

A guide's curvature is a channel of its own: a quarter superellipse with exponent above 2 meets its guide with zero curvature, a flat stripe along the guide, so superellipse quarters fit only where the anatomy is flat there (the sole's contact midline, the tibial face, the ulnar border).

## Rows along a chain

A chain's rows are its kept stations (its ends and every landmark a tape or a course is read at) and, between two consecutive kept stations, equal intervals as few as keep each one no wider than the chain's spacing. Inside a run the rows are then equally spaced and the spacing changes only at a kept station; two landmarks closer than a fraction of the spacing are one row, since an interval a fifth of its neighbours' prints as a ring under the C2 station rule. The spacing is the reference's density or finer: the trunk's rows stand at most 5 mm apart, under the smallest mean gap of the reference trunks' sections (5.25 mm), and the arm's at most 3 mm, under the reference arm's 3.5 mm plane spacing. Two chains that meet at a layer (the trunk and the shoulders at the axilla vault) take one family of rows and one station solve, so the shared layer carries one jet for both.

## Pose

Posed joints deform the composed rest shape: linear or dual-quaternion skinning carries the parts, and corrective shapes keyed on joint angles restore volume at the elbow, knee and shoulder. Pose acts on the composed skin, not on its construction.

## Composition of the head and body

- Head: cranium base (feature chains), face relief over a frontal chart (nose, lips, brow, cheeks, chin), auricles as appendages joined by strips, neck as an appendage below.
- Trunk: a closed thorax, abdomen and pelvis base with relief for breasts, buttocks and muscle masses, arms and legs as appendages rooted in closed loops on it, the neck a regular continuation.

## References

- Coons, S. A. Surfaces for computer-aided design of space forms. MIT Project MAC TR-41, 1967.
- Gordon, W. J. Spline-blended surface interpolation through curve networks. Journal of Mathematics and Mechanics 18, 1969.
- Bloomenthal, J. and Shoemake, K. Convolution surfaces. SIGGRAPH 1991.
- Kavan, L., Collins, S., Žára, J. and O'Sullivan, C. Skinning with dual quaternions. I3D 2007.
- Wang, W., Pottmann, H. and Liu, Y. Fitting B-spline curves to point clouds by curvature-based squared distance minimization. ACM Transactions on Graphics 25, 2006.
