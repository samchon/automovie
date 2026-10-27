# Campaign plan for #2997

The plan of [campaign #2999](https://github.com/samchon/automovie/issues/2999) for [#2997](https://github.com/samchon/automovie/issues/2997): every defect and every non-standard choice of the [survey](survey.md), mapped to the change that removes its cause. Step 3 of the Human skill's work order implements it in one pass.

## Goal

From #2997's Done when:

- every f1 module is fitted;
- each fit's surface distance to its observations is recorded;
- the exporter writes the modules, and the generator renders f1 from them without the world-height calibration and its repair rules.

## Shared method

Every curve and surface of every module is fitted by one method: a penalized spline in the generator's own representation, fitted by point distance minimisation to the module's observations. Its counts and smoothing are the simplest whose error on held-out whole sections is within one standard error of the best: the fewest parameters and the strongest smoothing the observations cannot tell apart from the best predictor.

The owner's order (2026-10-27) governs every rule below. The error against the observed rows may grow, even beyond the files' tolerance. No rule forces the surface onto the rows, and no count is raised or fit tightened because rows are missed; the observation tolerance `policy.toleranceMm` (0.2 mm) is a target nowhere. The surface distance is a recorded report that #2997 requires, read by no rule. Form and smoothness come from the mathematics:

- the natural spline in station, the least-curvature interpolant of the keys;
- the harmonic-acceleration penalty in phase, whose free shapes are the ellipses;
- the cap's least-rough continuation.

The observations only decide what those cannot.

Why held-out sections, and why the one-standard-error rule:

- f1's shape is known only through its observations, so some criterion must read them. A choice independent of the data needs a feature scale or a tolerance that no citation gives for this body, and the tolerance is the very target the order rules out.
- Held-out error on whole sections measures how well a surface predicts skin it was not fitted to. A count that chases one row's facet noise predicts its neighbours worse, so this criterion turns overfitting against itself.
- The one-standard-error rule then takes the most parsimonious candidate the data cannot distinguish from the best (Breiman, Friedman, Olshen and Stone 1984, Classification and Regression Trees, sec. 3.4.3; Hastie, Tibshirani and Friedman 2009, sec. 7.10). It accepts a larger error whenever the error is not reliably smaller, which is the order's preference for fewer parameters.

### Representation

The representations the generator evaluates stay as they are:

| Module | Surface | Unknowns |
| --- | --- | --- |
| base or appendage (`IAutoMovieHumanFeatureChain`) | `S(s, t) = O(s) + x(s, t) U(s) + z(s, t) V(s)`; each control coordinate interpolated over the key stations by `AutoMovieHumanFeatureChain.compose` (natural cubic spline, an owner's derivatives at a shared end, the cap formula's planes past `cap.from`), each section a periodic cubic B-spline of N control points | the control points of every key but a held shared key and a held pole key |
| relief (`IAutoMovieHumanRelief`) | base point moved along `axis` by a tensor-product uniform cubic B-spline whose three outer rings are zero | the interior heights |
| strip (`IAppendage`) | clamped cubic B-spline across, edge rows from both surfaces' jets, interior rows as offsets in the blend's frame, periodic cubic B-splines along the loop | the interior rows' control values and the reach |
| trim (`IAppendage.root`) | periodic cubic B-spline of M control points in the parent's chart | the M control points |

Frames, end stations, poles and shared keys are fixed before a fit; with them fixed, every surface above is linear in its unknowns (the reach alone enters non-linearly).

- A key's plane is the module's plane function at the key's station: the normal plane of the module's axis curve, turned across a joint as the observation plan turns its planes. That is `planBodySections.ts`'s rule (`:144`-`:148`, `:197`-`:212`), which the planner exports as a function of station, or a part's own axis curve, such as the Trunk's spline through its joints.
- Its in-plane axes start at the module's first key with `u` the module's front axis (Module frames and handles) made normal to the key's plane, and are carried key to key by rotation-minimising transport (Wang, Juttler, Zheng and Liu 2008, Computation of rotation minimizing frames). Phase 0 then lies at the same anatomical side on every module, and no key takes the planner's world-forward reference (`planBodySections.ts:144`-`:148`). This is the Hand's and the Foot's rule.

The fitter evaluates exactly what the generator renders. Add `AutoMovieHumanFeatureChain.weights(chains, name, s)` to `packages/human/src/network/AutoMovieHumanFeatureChain.ts`: the weights `w_k(s)` of every key's coefficients, and the weights of the owner's end slope and curvature where an interval ends on a shared key, such that `coefficients(s) = sum_k w_k(s) c_k + w_m(s) m_owner + w_M(s) M_owner` equals `AutoMovieHumanLoftChain.coefficients` of the composed chain, with first and second station derivatives. It is built from the same natural-spline system (`curvatures`), override rule and `AutoMovieHumanStationHermite.weights` that `compose` uses. The fitter checks at every sample that the weights reproduce the composed chain's coefficients and stops on any relative difference above `sqrt(eps)`, `eps = 2^-52`. Normals and all surface derivatives come from `AutoMovieHumanLoftJet.at`, exact for composed chains.

### Module frames and handles

The owner's order (2026-10-28) requires every module to stay transformable: a later pose, stylisation or deformation acts on modules without a refit, and no stored value is a world height, an absolute coordinate, a person-indexed number or a special case of a chain name. The orthodox form is hierarchical modelling. Each part is stored in its own local frame, the frames form the skeleton's hierarchy, and a transform of a frame carries everything stored in it (Hughes, van Dam, McGuire, Sklar, Foley, Feiner and Akeley 2014, Computer Graphics: Principles and Practice, 3rd ed., ch. 6, hierarchical modelling). Skinned characters bind skin to joints in the same way, in each joint's bind space (Magnenat-Thalmann, Laperrière and Thalmann 1988, Joint-dependent local deformations for hand animation and object grasping).

- Anchor: every module has one anchor frame, the bind frame of the bind-skeleton joint at which its axis begins.
  - The axis is the module's axis curve through bind joints. It is the joints' polyline of the observation plan as `planBodySections.ts` builds it, or a part's own curve through the same joints, such as the Trunk's natural spline from `pelvis`, the skeleton's root. A limb's runs from `upperarm` or `thigh`, the palm's from `hand`, the foot's from `foot`, and a digit's or toe's from its `_01`. The Head names its axis joints in its own section.
  - The frame is that joint's bind affine as `body-observations.json` records it (`skeleton.joints[].bindNativeAffineColumnMajor16`), registered by the same axis map as the joint positions (`HumanBodySkeleton.ts:4`-`:11`).
  - Its rotation is taken as the orthogonal factor of the polar decomposition (Higham 1986, Computing the polar decomposition, with applications), so any scale in the record leaves the frame orthonormal; its origin is the joint's bind translation.
  - No anchor is chosen per person or per module by hand. The rule reads the skeleton the source already carries.
- Named axes: a bind frame's axes follow the rig's convention for each bone, so they name no anatomical direction. Each module therefore also declares three unit axes in its anchor's coordinates, built from bind joint centres by cross products and Gram-Schmidt, as the ISB segment coordinate systems are built from landmarks (Wu et al. 2002, ISB recommendation on definitions of joint coordinate systems of various joints for the reporting of human joint motion, part I: ankle, hip, and spine, Journal of Biomechanics 35(4); Wu et al. 2005, part II: shoulder, elbow, wrist and hand, Journal of Biomechanics 38(5)):
  - along the module, its axis curve's tangent at the anchor;
  - toward its front: dorsal for a hand, a foot, a digit or a toe, forward for the trunk and the head;
  - lateral, the cross product of the other two.
  - A child module's axes are its parent's carried onto its own axis, as a skeleton hierarchy carries them.
  - The parts build them: the Trunk's from the hip axis, the Hand's palm frame from the knuckle line, the Foot's from the ankle's bend axis. "Up", "forward", "dorsal" and "palmar" are then a module's own directions, and they turn with it (Integration, "Frames, anchors and joints").
- Declared joints: each module declares the bind joints inside it or at its ends by their source names, each with its point in the anchor's coordinates and its station where the joint's plane lies in the module's station range. Each joint is declared by one module only.
- Stored relative to the anchor:
  - a key's station is arc length along the module's axis from the anchor joint, never a world height;
  - a key's plane (`frame`) is given in the anchor's coordinates, and every key carries one;
  - a cap's pole and a relief's axis are in the anchor's coordinates.
  - A relief's window is stations and phases of its base, and a trim's root is stations and phases of its parent (`IAppendage.root`), so both are already relative to the modules they ride on.
  - Observations, fits and the surface distance work in the registered world frame. The fit's output is converted to the anchor's frame by the anchor's rigid transform, which changes no fitted shape.
- Composition: interpolation commutes with the anchor's map. The natural spline and the B-spline sections are affine combinations of their keys and control points, their weights summing to one, so composing a module in its own frame and then placing it by its anchor equals composing it in place (the affine invariance of Bézier and B-spline curves: Farin 2002, Curves and Surfaces for CAGD, 5th ed.). `compose` places each module's keys by its anchor, then copies an owner's placed end layer into a shared slot unchanged. The copy is bit for bit, and the inherited-phase rule of the Integration section relies on that.
- Handles, what a module exposes to a later transform:
  - the anchor, a rigid frame: placing, posing or scaling the whole module about its centre;
  - the key stations: lengthening or shortening along the axis;
  - each key's control polygon in its plane: section shape and size, the stylisation of a cross-section;
  - the cap's pole: tip length and position;
  - a relief's net and window: the feature's projection and extent;
  - a strip's reach and rows: the softness of a join;
  - a trim's control points: the outline of a root.
  - Strips are rebuilt from both surfaces' jets and trims live in the parent's chart, so a join follows its modules wherever their anchors take them. The anchors are joints of one skeleton, so a pose of the skeleton moves every module rigidly. This campaign stores the form and builds no posing.
- Interface: `IAutoMovieHumanFeatureChain` today stores world coordinates. A key's station is "the world height of a horizontal one" (`IAutoMovieHumanFeatureChain.ts:91`-`:94`), its absent `frame` means horizontal at that height (`:96`-`:100`), the pole is in world mm (`:85`), and a relief's axis is a "unit world direction" (`IAutoMovieHumanRelief.ts:33`-`:34`). Files adds:
  - `anchor: { joint: string; frame: AutoMovieHumanLoftFrame.IFrame; axes: { along; front; lateral }; joints: { name; point; station? }[] }`: the joint's name, its registered bind frame in world mm, the named axes and the declared joints in the anchor's coordinates;
  - for an anchored chain, `frame` required on every key, and station, key frames, pole and relief axes read in the anchor's frame.
  - The exporter writes the anchor and the local values (Integration).

### Keys and control counts

Every count is selected, never fixed. The penalized-spline default `min(n_U / 4, 35)` (Ruppert, Wand and Carroll 2003, Semiparametric Regression; Wand and Ormerod 2008, On semiparametric regression with O'Sullivan penalised splines) is meant for a function that is not very wiggly. Ruppert 2002 (Selecting the number of knots for penalized splines, Journal of Computational and Graphical Statistics 11(4)) holds a count adequate only once a larger count no longer lowers the selection criterion. The counts follow Ruppert 2002's increasing search, with the section-blocked cross-validation score of "Smoothing parameters" as the criterion and the one-standard-error rule as the choice:

- Candidates: 5, 10, 20, 40, 80, 160, continued by doubling, up to the data's limit in that direction: the number of distinct abscissae there. The sequence and the cap at `n` are Ruppert's as Montoya, Ulloa and Miller 2014 restate them (A simulation study comparing knot selection methods with equally spaced knots in a penalized regression spline, International Journal of Statistics and Probability 3(3), sec. 4.2 and 4.3), citing Ruppert 2002 and Ruppert et al. 2003; Ruppert 2002's own text has not been read.
- Each candidate is fitted completely at its own selected smoothing parameters: the projection and solve loop, then the performance iteration. Its score is the held-out score at those parameters, and its standard error is the standard deviation of the fold scores over `sqrt(F)` (Hastie, Tibshirani and Friedman 2009, sec. 7.10).
- The search goes up while each new candidate's score is lower than the lowest earlier score by more than that score's standard error. Once a larger count fails to lower the score by more than its own uncertainty, the search stops. This is Ruppert 2002's check with the improvement judged against the score's standard error; it replaces Montoya, Ulloa and Miller's factor 0.98, whose source was not read.
- Of the candidates evaluated, the smallest count whose score lies within one standard error of the lowest is kept (the one-standard-error rule). A search that reaches the data limit reports it.
- Ruppert's search is univariate. A chain runs it in station with N held, then in phase with the key count held, and repeats until a pass changes neither count: cyclic coordinate search (Nocedal and Wright 2006, Numerical Optimization, 2nd ed., sec. 9.3). A pass that returns to a pair of counts already visited stops the search, keeping the simplest visited pair within one standard error of the lowest visited score, the key count deciding first. The first pass holds the other direction at the default `min(n_U / 4, 35)`; that is the default's only use. A relief net searches its rows and columns the same way.
- No count is raised to meet an error target. The rows carry facet noise, and a count that chases the files' 0.2 mm tolerance fits that noise.

What each count is, with its data limit:

- keys: the module's two end stations and the selected number of keys at evenly spaced admissible stations between them, each in the plane the module's plane function gives there (Representation). A key need not lie on an observed plane, since the fit projects every node onto the surface.
  - A station is admissible when the line its plane shares with each end key's plane misses the inside of the end key's loop and of the station's own start loop (`HumanModuleKeys.ts`). The two sections then cannot cross inside the skin, which would fold the surface. A plane parallel to an end key's is admissible.
  - The rule is general. A distal end on an oblique site plane is met inside the skin by the family's last planes, such as the foot's planes 244..247 at the metatarsal heads' plane (survey, Foot), and the trunk's neck base plane by the normal planes just below it (Trunk).
  - The limit is the number of the module's observed sections between its ends, the abscissae its data hold.
  - No key sits at a joint or a site by rule, and measurement sites stay named stations for #2998.
- section control count N. The limit is the Gauss nodes of the module's largest observed loop, 4 per Hermite span. A module that shares a key takes its owner's N, since `compose` refuses a shared key of another control count (`AutoMovieHumanFeatureChain.ts:225`); the owner's search scores the owner alone.
- trim control count M: the limit is the root loop's Gauss nodes.
- relief net: interior rows over the sections crossing the window, interior columns over the Gauss nodes inside it, plus the three zero rings on each side.
- strip interior rows: the limit is the sections crossing the strip, along the loop M. When that limit is below the first candidate, every count from 0 to the limit is evaluated and the one-standard-error rule chooses among them; no crossing section means no interior row.

What N = 35, the default's cap, can hold is evidence about the anatomy, not a rule; the 0.2 mm count below only reports, and selects nothing. Each observed section's largest-perimeter loop was projected by least squares on the periodic cubic B-spline of N uniform control points over arc length, and its largest distance to the result measured (`sectionResolution.ts` and `summarizeResolution.ts`, commands under "Self-review", round 6):

| Rows | Spacing at N = 35 | Largest distance at N = 35 | What it shows |
| --- | --- | --- | --- |
| head horizontal rows over the eye sockets, between 1586.83 and 1616.80 mm (lowest lower lid to highest brow point), observed from 1587.0 to 1614.0 mm | 15.7 to 19.6 mm | median 0.510, 90th percentile 3.523, maximum 4.136 mm | the worst point lies at azimuth ±92 to ±105 degrees from 1587.5 to 1596.0 mm, on the auricles inside the row, and at ±19 to ±31 degrees from 1596.5 to 1598.5 mm, at the palpebral openings; above, 0.217 to 0.900 mm at 0 to ±22 degrees from 1599.0 to 1607.5 mm, at the front of the brow rows |
| tilted lower head rows below the mentolabial fold (origins 1425.0 to 1505.5 mm: chin and jaw) | 9.3 to 14.5 mm | median 0.096, 90th percentile 0.264, maximum 0.725 mm | 131 of 162 loops lie within 0.2 mm |
| trunk rows whose worst point is at the back midline (azimuth within 22.5 degrees of 180) | 19.3 to 34.6 mm | means 0.63 to 1.08 mm and maxima 1.03 to 1.54 mm per 100 mm band from 1000 to 1399 mm | the spinal groove; each row reports only its worst point, so the scapulae show only where they are worse than the groove: the 11 rows worst within 22.5 degrees of ±135 degrees have at most 0.287 mm |
| trunk rows from 807.1 to 899.1 mm | perimeters 1209.6 down to 987.0 mm | 2.18 to 7.24 mm, worst at ±179 to 180 degrees (the intergluteal cleft) and at 0 to ±19 degrees from 825.1 to 837.1 mm | the present trunk fitter takes these rows into its cap, from the leg root loops' highest point down to the Rise course's lowest point, with the leg root regions masked (`fitTrunkBase.ts:128`-`:133`, `:406`). The rows 807.10 to 813.10 mm hold both thighs' tops (survey, Trunk), and the Trunk partition gives their arcs distal of the leg root loops to the Legs, so the perimeters are a partition matter, not a resolution one |

So at N = 35 the chin and jaw are held; the auricles, the palpebral openings, the front of the brow rows and the spinal groove are not; this measure cannot show the scapulae. The auricles and the palpebral openings leave the head base by partition (the auricle and eye-aperture modules). The brow rows and the spinal groove are base skin, so the count search decides whether the held-out sections support a larger N there.

### Caps

A cap continues its chain past its end key to the pole. The end key's station `cap.from` is given by the part's geometry: the last station whose section is wholly the module's own skin, by the part's partition.

The pole is the module's terminal: the first critical point of the section coordinate on the module's source component past its end key's plane. The coordinate increases along the chain's end direction. Morse theory places a change of the sections' topology only at a critical point of the coordinate (Milnor 1963, Morse Theory, Annals of Mathematics Studies 51; Reeb 1946, Sur les points singuliers d'une forme de Pfaff complètement intégrable ou d'une fonction numérique), so the terminal is either:

- a maximum, where the component ends: a crown, a fingertip or a toe tip;
- a saddle, where it splits into the appendages beyond: the crotch below the trunk, the first web beyond a palm or a foot.

Recovery's section API observes it from the source mesh: seeded with the module's loop in its end key's plane, it follows that loop's component toward increasing coordinates and returns the component's maximum and its critical events with their component counts (`terminalSeeds`, `terminals`, `packages/recovery/src/structures/mesh/IAutoMovieRecoverySectionsInput.ts:35`-`:36`, `IAutoMovieRecoverySourceTerminal.ts`).

- The pole is the first event that splits the component (more components above it than below), when one comes before the maximum; otherwise the maximum, when Recovery marks it single-tip qualified.
- A terminal that is neither stops the fit and is reported, with no fallback.
- One rule holds for every module, and no tie can occur. A farthest observed point would lie in the end plane itself for a module whose observations lie in planes parallel to its end key (the digits and toes, 0.0 mm past it on every digit: survey, Hand), and would tie across the trunk's horizontal lowest row.
- A bottom cap's coordinate increases downward. Its end plane is observed with its normal reversed for the terminal (Observation families below).
- The Trunk asked for its pole where its axis, continued past the end, meets the Rise course. That is rejected. The point depends on how the axis is continued past its last joint and on a measurement course, both constructions. The crotch saddle is the skin's own critical point, where the trunk's component splits into the legs, and Recovery observes it. The same terminal also replaces the Hand's and the Foot's farthest own-skin poles of the palm and the foot base, so every cap has one rule.

Its keys continue the base's mean key spacing `D`: `round(rho pi / (2 D))` keys, at least one, evenly to the pole's station `cap.from + sigma rho pi / 2` (sigma 1 for a top cap, -1 for a bottom one), `rho` the pole's distance from the end plane. Their planes are the cap formula's (`compose`), their control points are unknowns like every key's, and the pole key is held. Where observations reach the cap, they shape it; where none do, the penalty alone continues the end section to the pole by its least-rough extension. No section is scaled by `sin(theta)` and no hemisphere is imposed. The terminal replaces every other pole rule of the present fitters and the parts' plans:

- the palm's and foot's middle digit first-key centroid (`fitBodyBase.ts:211`-`:215`);
- the digits' farthest point along the last bone (`fitAppendage.ts:150`-`:163`);
- the trunk's Rise course lowest point (`fitTrunkBase.ts:129`-`:130`), whose role the crotch saddle takes;
- the head's calibration crown (`fitHeadBase.ts:154`).

### Observations and weights

- Each observed loop of the module contributes its Hermite spans at 4 Gauss-Legendre nodes per span, the rule exact to degree 7, which covers a cubic residual squared in the span parameter (Davis and Rabinowitz 1984, Methods of Numerical Integration).
- A node's weight is its Gauss weight times the span's speed there times the span's phase interval (its arc length share) times the section's trapezoid spacing, half the sum of the station gaps to its neighbours among the module's sections ordered by their median foot station, so the sum approximates the surface integral of the squared distance and dense rows do not outweigh sparse ones.
- A node's block is its section: cross-validation leaves out whole sections.
- Which observations belong to a module is the part's data partition: families, family planes, root loops, landmark regions, apertures, all decided by geometry or topology before the fit.
  - `HumanObservation.ts` carries it as one label per node, the module or "none", given by the part's predicates over observation space: family, plane, a node's position, its arc of a row.
  - A row is cut into arcs where it crosses a plane the part names (a root loop's plane, an armscye plane). The crossings are found by intersection with no tolerance, as the survey's Trunk subsection finds them, and an arc takes one label.
  - The labels are fixed before any surface exists and read no residual.
  - The partition record (each module's node count, every cut and every predicate's inputs) is written with the fit.
  - A node a fit cannot use is dropped and counted by reason. The reasons are those of Foot points, plus "relief region outside its window" for a relief's node whose foot falls outside the window.
- Head sections that follow the lip contact into the mouth or run into a nostril (`EarSectionGeometry.ts:244`-`:255` describes them) are the Head partition's to remove. No observation is ever removed by its residual: the fit has no robust weight. Tukey's biweight and asymmetric least squares (`HumanModuleFitting.ts:977`-`:985`) are standard M-estimators, but they drop observations whose residual is large, which is the exclusion the campaign forbids, and a misfit they hide is a misfit the surface distance must show.
- A base under a relief is fitted first, without the observations of the relief's region, so it fits only its own skin and the penalty bridges the region; the relief is then fitted over that base to every observation whose foot falls in its window.

### Observation families

The shared observation code (`observeBodySections.ts`, `findRootKeys.ts`) is Method's.

**Succession.** A family follows its module by topological succession of sections instead of the origin test of `--around` (`observeBodySections.ts:20`-`:23`, `:211`):

- The first plane keeps the loop that winds round its origin.
- Each later plane keeps the loop that winds round its origin when that loop overlaps the predecessor's kept loop. Otherwise it keeps the one loop that overlaps the predecessor's kept loop.
- Two loops overlap when a point of either lies inside the other by the even-odd rule, the predecessor's loop projected onto the plane along the plane's normal.
- A plane where no loop overlaps ends the run. A plane where several do and none winds round the origin also ends it, and is reported.
- Before an appendage's root the loop round the origin is the joined loop both tests keep, so the planes up to the root are unchanged.

**Continuation.** The plan's planes end one bone length past the last joint (`planBodySections.ts:119`-`:126`). The family continues past them:

- Recovery's terminal is seeded with the run's last loop.
- When its maximum lies past the last plane, planes are added along the last plane's normal at the family's own spacing up to the maximum's coordinate and observed with succession. The spacing is the distance between its last two planes.
- The terminal record is saved with the family.
- Each capped module's end key plane, at `cap.from` as its part's geometry gives it, is observed on its own with the axis along the plane's outward normal, and its loop round the module's axis seeds the terminal. The plane need not belong to an observed family. Recovery follows a seed toward increasing coordinates, so a bottom cap's plane takes its normal reversed.

**Families.** The digit and toe families become `<digit>_<s>-v3.json.gz` and `<toe>_<s>-v3.json.gz` (schema `automovie-human-body-sections-v3`), with their terminals. This is the one change both the Hand and the Foot asked for. Every other capped module's family keeps its file, and its terminal record is written beside it.

**Roots.** `findRootKeys.ts` tests the joined loop against every sibling: a loop is joined while it winds round the crossing of its parent's axis or of any sibling appendage's bone polyline. The siblings are the other digits of the palm, the other toes of the foot, and the other limbs of the trunk. This is the separated root of the Hand plan; `measureIdentity.ts` already tests a leg root against the other femur. Its `-root-v2` files hold a neighbour's skin for the left middle, the left pinky and the right ring (survey, Hand). It writes `-root-v3.json` from the `-v3` families, and the parts read their roots from those files.

The outputs are private observations under `test/.shots/<alias>/body-sections/`.

### Strips

The strip method (`HumanStripFitting.ts`, driven by `fitStrip.ts`) reads its inputs from the parent fit's `strips` record, which the part writes from its geometry and partition (`HandGeometry.ts`, `FootGeometry.ts`, `trunk-base.json`'s partition record), never the parent fit's `regions` and `radius`:

- each appendage's root loop (the separated root);
- its trim direction, the root plane's normal;
- the labels of the strip's observations.

It reports each column's band width, the chord between the column's two edges. A column whose trim point lies past the appendage's first key plane on the appendage's side has a crossed band, and the fit stops on it.

A strip whose partition gives it no observation has no data term. Its rows are then the penalty's minimiser, zero, and the objective no longer depends on the reach, which keeps the bracket's start, 1, the straight blend. The fit reports it (the Hand's digit strips).

### Foot points

Each node's foot `(s, t)` is its orthogonal projection on the current surface, by point inversion (Piegl and Tiller 1997, The NURBS Book, sec. 6.1):

1. Start at the nearest point of the surface sampled at its knots and the midpoints between them, in station and in phase.
2. Newton's method on `|S(s, t) - q|^2 / 2` with the exact jets.
3. Stop when a step is no shorter than the one before it: rounding is reached.
4. The foot is kept when it is a foot. That is Piegl and Tiller's zero-cosine test: the residual `S - q` is orthogonal to both tangents, `|S_s . (S - q)| <= sqrt(eps) |S_s| |S - q|` and the same for `S_t`, where `sqrt(eps)` is the rounding of a computed cosine. Piegl and Tiller's distance test is not used, so no distance decides a foot and a far observation keeps its true foot. A foot is dropped and counted when it fails the test, when it leaves the module's station range (it lies beyond the module's ends), or when it ends where the Hessian is not positive definite.
5. At most `ceil(log2 53) + 1 = 7` iterations: Newton's convergence is quadratic near a solution, doubling the correct bits per step, so 6 steps take one correct bit to binary64's 53 (Dennis and Schnabel 1996, Numerical Methods for Unconstrained Optimization and Nonlinear Equations, ch. 5; IEEE 754-2019). A node that has not converged by then started outside Newton's quadratic region; it is dropped and counted.

The same rule projects a node along a relief's axis (`B(s, t) + h a = q`, three unknowns), intersects a root loop's bone line with its parent (`S(s, t) = q + lambda a`), and projects onto a strip. The strip has no jets, so its derivatives are central differences at the optimal steps `eps^(1/3)` and `eps^(1/4)` of the variable's scale, `eps = 2^-52` (Press et al. 2007, Numerical Recipes, 3rd ed., sec. 5.7).

Every fit reports its counts of kept and dropped nodes by reason.

### Solve

With the feet fixed, the unknowns `c` minimise the penalized least-squares objective

`sum_i w_i |q_i - S(s_i, t_i)|^2 + lambda_s c^T P_s c + lambda_t c^T P_t c`

with the full residual vector, so a point's slide along the surface counts as well as its offset (point distance minimisation with parameter correction: Hoschek 1988, Intrinsic parametrization for approximation; Wang, Pottmann and Liu 2006 name it PDM). No tangential term is added.

Penalties, in the tensor-product form of Eilers and Marx 2003 (Multivariate calibration with temperature interaction using two-dimensional penalized signal regression) and Currie, Durban and Eilers 2006 (Generalized linear array models with applications to multidimensional smoothing):

- chains, station: `P_s = R_s (x) I_N`, `R_s[k][l] = integral w_k''(s) w_l''(s) ds` over the chain from `weights`, exact by 4-point Gauss-Legendre per interval (a quintic's second derivative squared is degree 6); the owner terms enter the right-hand side. Its null space, coefficients linear in station, leaves tapering tubes unpenalized (Green and Silverman 1994, Nonparametric Regression and Generalized Linear Models, ch. 2).
- chains, phase: `P_t = I_K (x) G_t`, `G_t[j][l] = integral (L B_j)(L B_l) dt` over one turn with the harmonic acceleration operator `L = D^3 + D` (omega 1 per radian, the phase's period 2 pi), exact by 3-point Gauss-Legendre per span. Its null space `{1, cos t, sin t}` holds every ellipse, so a closed section is not shrunk toward its centroid (the harmonic acceleration operator of Ramsay and Silverman 2005, Functional Data Analysis, 2nd ed.).
- reliefs and strips: second-order difference penalties in each direction (Eilers and Marx 1996, Flexible smoothing with B-splines and penalties), periodic along a strip's loop.
- trims: `G_t` along the loop; a trim's residual is measured on the parent surface through its first fundamental form at each intersection point (exact jets), so station and phase enter in millimetres of skin.

The normal matrix is banded in phase (a control point couples to three neighbours on each side), cyclic, with dense key blocks of size `2K`. It is factored directly by banded Cholesky with the cyclic corner blocks eliminated by the Schur complement (Golub and Van Loan 2013, Matrix Computations, 4th ed., sec. 4.3 and 2.1.4); no iterative solver, no iteration cap. Cholesky succeeds exactly when the matrix is positive definite (sec. 4.2): a non-positive pivot stops the fit and names its unknown, one that neither data nor penalty reaches. No pivot or divisor is floored.

### Iteration

For fixed smoothing parameters, projection and solve alternate. The kept set is frozen at the loop's first projection; a later projection of a kept node that fails, or that ends no nearer than its current foot, leaves its foot where it was. Each projection then lowers the objective over the feet or leaves it, and each solve over the control points, so the objective cannot rise. The loop stops when an alternation lowers the objective by no more than `eps` times its value: near a minimum the objective is flat to rounding while the solution still moves within `sqrt(eps)` (Press et al. 2007, sec. 10.1). No distance threshold stops it.

### Smoothing parameters

`lambda_s` and `lambda_t` are chosen by cross-validation over whole observed sections:

- Folds: the module's sections in station order, section `i` in fold `i mod F`, `F = min(10, sections)`, at least two sections (ten folds: Hastie, Tibshirani and Friedman 2009, The Elements of Statistical Learning, 2nd ed., sec. 7.10.1; Kohavi 1995). Nodes along one Recovery curve have correlated errors, which per-sample GCV takes as independent and answers by undersmoothing (Opsomer, Wang and Yang 2001, Nonparametric regression with correlated errors); whole sections are the independent blocks (Burman, Chow and Nolan 1994, A cross-validatory method for dependent data; Roberts et al. 2017, Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure). A single-curve fit (a trim) takes the curve's Hermite spans as its blocks.
- Score: the weighted mean squared distance of each fold's nodes to the surface solved without that fold, feet fixed.
- Search: Powell's method (Powell 1964) with Brent's line minimisation (Brent 1973, Algorithms for Minimization without Derivatives) in `(log lambda_s, log lambda_t)`, relative tolerance `sqrt(eps)` (Brent's least advisable), from the balanced start `lambda_0 = tr(data Hessian) / tr(P)` per penalty (Wood 2017, Generalized Additive Models, 2nd ed., mgcv's initial smoothing parameters), within `lambda_0 [eps, 1 / eps]`, beyond which the penalty or the data falls below rounding in the normal equations; a parameter that reaches an end of that range is held there and the fit reports it. A trim has one parameter and takes Brent's method alone.
- Choice: from the minimum, both parameters are multiplied by a common factor of at least 1. The bound is the minimum's score plus its standard error (its fold scores' standard deviation over `sqrt(F)`). Brent's zero finder (Brent 1973, ch. 4) finds the factor where the score crosses the bound, bracketed by 1 and the factor that takes a parameter to the range's end. When the score at that end is still within the bound, the end is kept. The parameters at the found factor are kept: the smoothest surface the held-out sections cannot tell from the best (the one-standard-error rule, Hastie, Tibshirani and Friedman 2009, sec. 7.10).
- Performance iteration (Gu 1992, Cross-validating non-Gaussian data): select at the converged feet, iterate the fixed-parameter loop at the selection, select again. It stops when a selection's minimum score is not lower than the previous one, keeping the fit of the lower minimum.

A relief's axis is the minimum-norm `a` with `n_i . a >= 1` over the fitted relief's normals, normalised (the axis of the cone of normals: Shirman and Abi-Ezzi 1993, The cone of normals technique for fast processing of curved patches), solved exactly by the dual active-set method (Goldfarb and Idnani 1983, A numerically stable dual method for solving strictly convex quadratic programs); the first fit takes the base's mean normal over the window, and axis and fit alternate until the active set repeats; when it repeats a set older than the last one, the fit of lowest objective in that cycle is kept. No feasible `a` means the feature is no height field: the part makes it an appendage. A strip's reach is chosen by Brent's method on the strip objective with the rows solved at each reach (variable projection: Golub and Pereyra 1973), bracketed from 1 (the straight blend) and the golden ratio by golden-ratio expansion (Press et al. 2007, sec. 10.1).

### Surface distance

After the final fit, every node of the module, kept or not, is projected on the final composed surface (reliefs included) by the foot rule. The fit's JSON gets a `distance` record: nodes observed, kept, dropped by reason, the area-weighted RMS distance, the median, 95th and 99th percentiles and the maximum of the kept distances with the maximum's point, and the same per section. Add `reportDistances.ts`, which reads every fit JSON in `.shots/claude-scratch/` and writes one table to `.shots/claude-scratch/distances.txt`; parts and Integration quote it with that command and file. The record is a report: no count, parameter, stop or acceptance reads it.

### Constants

| Constant | Value | Source |
| --- | --- | --- |
| count candidates (keys, N, M, relief net, strip rows) | 5, 10, 20, 40, 80, 160, doubling up to the distinct abscissae | Ruppert 2002, as restated by Montoya, Ulloa and Miller 2014, sec. 4.2 |
| count search stop | the new score not lower than the lowest earlier one by more than its standard error | Ruppert 2002's check; the standard error of Hastie, Tibshirani and Friedman 2009, sec. 7.10 |
| count and smoothing choice | the simplest within one standard error of the lowest score | Breiman et al. 1984, sec. 3.4.3; Hastie, Tibshirani and Friedman 2009, sec. 7.10 |
| held count in the first pass of the coordinate search | `min(n_U / 4, 35)` | Ruppert, Wand and Carroll 2003; Wand and Ormerod 2008 |
| Gauss-Legendre nodes per span | 4 | exact for degree 7 (Davis and Rabinowitz 1984) |
| foot test | zero cosine within `sqrt(eps)`; no distance test | Piegl and Tiller 1997, sec. 6.1; rounding of a computed cosine |
| iteration stop | objective decrease at most `eps` times its value | Press et al. 2007, sec. 10.1 |
| Newton iterations | 7 | `ceil(log2 53) + 1`, quadratic convergence (Dennis and Schnabel 1996), binary64 (IEEE 754-2019) |
| difference steps on strips | `eps^(1/3)`, `eps^(1/4)` | Press et al. 2007, sec. 5.7 |
| folds | `min(10, sections)` | Hastie, Tibshirani and Friedman 2009; Kohavi 1995 |
| Brent tolerance | `sqrt(eps)` | Brent 1973 |
| smoothing range | `lambda_0 [eps, 1 / eps]` | binary64 rounding |
| harmonic operator | `D^3 + D` | Ramsay and Silverman 2005; phase period 2 pi |
| penalty quadrature | 4 nodes (station), 3 nodes (phase) | exact for the integrands' degrees |
| cap keys | `round(rho pi / (2 D))`, at least one | the base's mean key spacing `D` |
| reach bracket | 1 and the golden ratio | the straight blend; Press et al. 2007, sec. 10.1 |
| `weights` check | relative `sqrt(eps)` | binary64 rounding |

### Module data format

The exporter, Integration's (its section, Export), writes `IAutoMovieHumanBodyRegion` literals:

- `networks`: `IAutoMovieHumanFeatureChain` with its `anchor`, its keys, pole and relief axes in the anchor's frame (Module frames and handles), reliefs inside their chains, `ends` naming each shared key's owner, and `cap` with its pole;
- `appendages`: `IAppendage`;
- lengths to 0.001 mm and unitless values to 1e-6, as now.

The trunk region declares `stature`, the f1 specimen's applied height from `packages/playground/src/human-parameters/f1.ts`. The head region writes `apertures` and `eyes` when the Head plan places them there (`IAutoMovieHumanBodyRegion.ts:55`, `:58`). An opening with a `base` is stored as a trim in its base's chart, and the eyes in the head anchor's frame, so they move with their modules (Head).

Shared keys are not written as events: `merge` derives them. A sharer's shared key is written as its owner's, so the literal agrees with what `compose` copies.

A chain's `samples` is the renderer's ring tessellation, not a fitted value: the fitters keep writing `2N` and Integration sets it from the render.

### Generator evaluation

Change `AutoMovieHumanBodyRegions.merge` (`generation/AutoMovieHumanBodyRegions.ts`):

1. Compose every region's networks in one `AutoMovieHumanFeatureChain.compose` call, so owners in other regions resolve and every chain carries jets; drop `expand` there. `compose` places each anchored chain's keys, pole and relief axes by its anchor before solving, and copies an owner's placed end layer into the sharer's slot exactly, without re-placing it. The child's end layer then equals the parent's in every bit, which the Integration section's inherited-phase rule tests.
2. For every shared end, add the continuation event `{parent: owner, direction: owner end "top" ? "up" : "down", splits: [{child, arcs: [[0, 2 pi]]}]}`, so the sharer inherits its owner's ring instead of closing at a pole (`AutoMovieHumanBodySurface.boundary`).

Strips, trims and shading normals then read exact jets everywhere.

### Files

Generator, `packages/human/src` (Method, step 3):

- `network/AutoMovieHumanFeatureChain.ts`: add `weights`; `compose` and `weights` place an anchored chain by its anchor and copy a shared end layer exactly. `compose` carries the anchor, the named axes and the declared joints, placed in the world, onto each loft chain, so the merged calibration hands them to the consumers (Integration, "Frames, anchors and joints").
- `lofting/IAutoMovieHumanLoftChain.ts`: the placed anchor, axes and joints a composed chain carries.
- `network/IAutoMovieHumanFeatureChain.ts`: add `anchor`. For an anchored chain, require `frame` on every key and read stations, key frames and the pole in the anchor's frame; the JSDoc states it.
- `network/IAutoMovieHumanRelief.ts`: `axis` in the base chain's anchor frame when the base is anchored.
- `generation/AutoMovieHumanBodyRegions.ts`: `merge` as above.

Shared fitting code, `test/src/executable/reference-experiments/human-calibration/` (Method, step 3):

- `HumanModuleFitting.ts`: rewrite as the driver (projection, solve, iteration, selection, distance) for chains; delete `cloud`, `nearest`, `standoff`, `sampling`, `project`, `basins`, `connected`, `watershed`, `IOptions` with `threshold`, `cap`, `rounds`, `mask` and `asymmetry`, `fit`, `spread`, `scale`, `crossValidated`, `key`, `keyStations`, `BAND`, `TINY`, `SLIDE`, `conjugate`, `rademacher`, `cardinalBasis`, the `composed` switch (every fit is composed), `Normal`, `Model`, `bspline`, `cellKey`, `IChart`, `IKeySite`, `IResult` and `ICrossValidated`; keep `loft` with `owners`, `meanRadius`, `tree`, `KdTree`, `wrap` and the vector helpers. The part fitters' region code maps landmarks and root loops to the chart by the foot rule instead of `sampling` and `project`.
- `HumanObservation.ts` (new): Gauss nodes, weights and blocks from Hermite section files. It also holds a part's partition: per-node labels from the part's predicates, rows cut into arcs at named planes by intersection, the partition record, and the drop reasons with "relief region outside its window".
- `HumanModuleAnchor.ts` (new): a module's anchor from its joint's bind affine through the polar decomposition, its named axes and declared joints in the anchor's coordinates, and the rigid conversion of keys, poles and relief axes between the world and the anchor's frame.
- `planBodySections.ts`: export its plane rule as a function of station along a module's axis, the planes it writes being that function's values.
- `HumanBodySkeleton.ts`: also read each joint's bind affine (`bindNativeAffineColumnMajor16`), registered as the positions are.
- `observeBodySections.ts`: succession, continuation to the terminal, terminal seeds with a reversible axis, schema v3 for the digit and toe families (Observation families).
- `findRootKeys.ts`: the sibling-bone test and `-root-v3.json` from the `-v3` families.
- `HumanFootPoint.ts` (new): point inversion on chains, reliefs and strips, line intersection, drop reasons.
- `HumanPenalizedSystem.ts` (new): normal equations, `R_s`, `G_t`, difference penalties, the cyclic banded Cholesky.
- `HumanSmoothingSelection.ts` (new): section-blocked folds and their standard error, Powell and Brent, the one-standard-error choice.
- `HumanModuleKeys.ts` (new): key stations, the increasing count search with the one-standard-error choice in each direction and the coordinate search over both, the admissible stations, cap keys, start keys from the module's own nodes of the observed section nearest each key (each gap the partition leaves in that section closed by the chord across it, the points moved along the axis tangent into the key's plane when it is no observed plane, and taken in the key's in-plane axes), resampled at 4N uniform phases of the chain's rule (`project` needs a multiple of N) and projected on N control points by `AutoMovieHumanSplineCurve.project` without a cutoff; the start only seeds the first projection.
- `HumanReliefFitting.ts`: rewrite on the shared method; delete the axis grid search, `localNormal`, the outermost-cell rule, `REACH`, the 12-iteration `along`, the thin-plate energy, generalized cross-validation with Hutchinson's estimator and its golden section, and the floored `choleskyFactor` and `solve3`.
- `HumanStripFitting.ts` (new) with `fitStrip.ts` as its driver: the inputs from the parent fit's `strips` record, exact trim intersection, trim fit, rows, reach, the band report and the crossed-band stop (Strips); delete from `fitStrip.ts` the reads of the parent fit's `regions` and `radius`, the `-root-v2` loop and the proximal family planes (`:114`-`:122`, `:322`-`:378`), `CAP`, `SLIDE`, the cell carrying rule, the count-up trim, the reach doubling, the row rule, the biweight, the two pairing rounds, the thin-plate energy, generalized cross-validation with Hutchinson's estimator, and the floored `choleskyFactor` and `solveDense`.
- `reportDistances.ts` (new).
- `exportModules.ts` is Integration's, as the Human skill gives export to Integration. Its changes (the anchors, `stature`, openings and eyes, the `distance` check, the parts' inputs and comments) are listed under `## Integration`, Export.
- Delete: `analyseBase.ts` (stand-off detection on the removed API), `observeFootSections.ts` and `FootSectionGeometry.ts` (they serve only the retired `foot-sections-v1.json.gz`, survey, Foot), `fitFeatureChain.ts` and `emitHeadRegion.ts` (superseded by the part fitters and the exporter), `HumanSectionCorrespondence.ts`, `HumanEventReconciliation.ts`, `FootCorrespondence.ts`, `EarSectionGeometry.ts` (imported by nothing: `import ... from "./"` search over the directory), `emitEarCalibration.ts`, `emitFootCalibration.ts` (emitters of retired literals), the stale `README.md` and `SESSION-REJECTED.md`. A README of the shared method's usage replaces them, and it keeps rows for the fitters that stay: `fitEyeCalibration.ts`, `fitBodyMorph.ts` until Retirement deletes it, the auricle scripts and the observation tools.
- `fitAuricleSet.ts` and `runAuricleSet.ts` call `sampling` and `project`, which this rewrite removes, and `HumanImplicitFitting.ts` serves only them; `fitAuricleSet.ts` also holds the plan of the `rim-normal-v1.json` observation. Their rules are not the shared method's. Three break the owner's order:
  - the root loop's control count raised until it lies within one chart cell, `fitAuricleSet.ts:71`-`:87`;
  - the region observations kept by their stand-off beyond the robust scale, `runAuricleSet.ts:160`;
  - the implicit fit smoothed to the rows' error `0.2 / sqrt 3`, `:60`.

  The rest carry invented constants or floors:
  - the rim spline's penalty `1e-3 n`, `fitAuricleSet.ts:216`;
  - the ribbon's 16 columns and penalty `1e-2`, `runAuricleSet.ts:301`, `:323`;
  - `REACH` 40 mm and radius 75 mm, `:59`, `:205`;
  - the divisors `|| 1e-300` and `|| 1e-30`, `:688`, `:706` and `HumanImplicitFitting.ts:131`.

  They stay until the Head plan ports them onto the shared method or deletes them.
- `fitBodyMorph.ts` also emits `AutoMovieHumanBodySpecimenCalibration.ts` (`:355`-`:385`), which stays: that branch moves to `emitSpecimenCalibration.ts` (new) before Retirement deletes `fitBodyMorph.ts`, and the literal's comment names the new emitter.

The part fitters move onto the shared method under their owners' sections below: `fitTrunkBase.ts`, `fitTrunkReliefs.ts`, `fitHeadBase.ts` and `fitHeadReliefs.ts`; `fitHand.ts` with `HandGeometry.ts` and `fitFoot.ts` with `FootGeometry.ts`, which replace the palm, foot, digit and toe branches of `fitBodyBase.ts` and `fitAppendage.ts`. Each keeps only its module's geometry (anchor joint, ends, frames, the terminal seed, data partition, strip records) and calls the shared driver.

## Retirement

What is deleted, in this order within step 3:

1. Method lands the shared fitting code, the anchor fields, `weights` and `merge`. The world-height calibration still renders, since no region carries networks yet. Method then runs the observation tools: the `-v3` digit and toe families, their `-root-v3.json` files, and every capped module's terminal from the seed its part names. The outputs are private under `test/.shots/`.
2. The parts fit in the skill's order (Trunk, then Head; Hand, then Arm; Foot, then Leg; strips after both their modules). No fitter reads the world-height calibration:
   - `fitTrunkBase.ts` takes its start keys from the observed trunk rows and its neck ring on the Neck Base course's plane (Trunk);
   - `fitHeadBase.ts` takes its start keys from the observed head rows and its key planes from its own axis's plane function (Head);
   - every pole is its module's terminal.
3. Integration exports the modules and replaces `AutoMovieHumanBodyCalibration` by the merge of the module regions and the eye region, with no repair rule. In the same change it deletes:
   - `calibration/AutoMovieHumanTorsoCalibration.ts`, `AutoMovieHumanFootCalibration.ts`, `AutoMovieHumanEarCalibration.ts`, once the head module region carries the two nostril apertures and their pockets, which today live only in `AutoMovieHumanEarCalibration` (the Head plan refits or carries them);
   - `AutoMovieHumanSectionLoops.ts`, `AutoMovieHumanContactSmoothing.ts`, `AutoMovieHumanLipSmoothing.ts`, `AutoMovieHumanCornerSmoothing.ts`, `AutoMovieHumanStationContinuity.ts`, `AutoMovieHumanEventJoin.ts`;
   - in `AutoMovieHumanBodySurface.ts`: `ringBlend` and its constants, the 30-degree fallback of `surfaceNormals` (every chain carries jets), `domeBase`, the dome in `pole` and their constants;
   - the shape basis and the warp, which read world-height chain names and layers and cannot carry over (survey root cause 5): `calibration/AutoMovieHumanBodyMorphCalibration.ts`, `IAutoMovieHumanBodyMorph.ts`, `AutoMovieHumanBodyWarpField.ts`, `AutoMovieHumanBodyWarp.ts`, `AutoMovieHumanBodyGirth.ts`, `AutoMovieHumanBodyLandmarks.ts`, and `fitBodyMorph.ts`; `AutoMovieHumanBodyLaw.calibrate` returns the module calibration and `AutoMovieHumanVermilionCalibration` for every input until #2998 builds the measurement law, so f2, m1 and m2 render as f1 scaled to their stature until then. `calibration/AutoMovieHumanBodySpecimenCalibration.ts` (f1's applied inputs, no chain) stays for that law.
4. Integration re-points every consumer of world-height chain names (survey, Couplings and "Everything that depends on it") to the module chains, then renders f1. It brings the documents that describe the retired code to the current facts in the same change: `docs/techniques/section-chain-lofting.md` (the shape basis) and the fitters' `README.md` row for `fitBodyMorph.ts`.

`AutoMovieHumanEyeCalibration` (apertures and globes from landmark curves) and `AutoMovieHumanVermilionCalibration` (the saved Recovery lip boundary) are not world-height data and stay unless the Head plan replaces them.

| Survey item | Removed by |
| --- | --- |
| root causes 1, 2, 4 (rows stored as shape, one section per height, repairs after the fit) | Retirement steps 3 and 4: no row is stored, no repair runs |
| root cause 3 (horizontal contact rings) | appendages on root loops through strips, shared keys as continuation events |
| root cause 5 (basis and law tied to chain names) | Retirement step 3 deletes them; #2998 builds the law on the modules |
| root cause 6 and the rows of the survey's non-standard table | Shared method, Files; three rows stay outside it: the plane half-width (kept as the observation plan), the identity definitions (#2998) and `samples` (Module data format, Integration's render) |
| `merge` evaluates `expand`, no stature, shared ends closed as poles | Generator evaluation; Module data format |
| modules stored in world coordinates, stations as world heights, no anchor | Module frames and handles; Files (`anchor`) |
| families stopped by the origin test, root loops holding a neighbour's skin | Observation families |
| no fit output, no distance record | the parts' fits; Surface distance |
| open defects at the canthi, auricles, lips, nostrils, chin, forehead and thighs, abdomen, gluteal fold, axillae, crotch | rows and repair rules retired (Retirement); each part's module replaces the rows under its section below |
| hair-card defects, shape-law residuals | outside #2997: the hair rules and #2998 |

## Trunk

The Trunk part fits one trunk base and four reliefs, the two breasts and the two buttocks, by the shared method, and owns the neck ring. Every module lives in the trunk's own frame, anchored at the pelvis joint's bind frame (Module frames and handles), with its axis and key frames derived from the spine and hip joints, and is placed by that frame, the body courses and the root loops (Order 2): no world height, absolute coordinate or person-indexed value defines a key, an end or a region, and the f1 numbers below only illustrate; its counts and smoothing come from the shared selection, so nothing below adds a key, raises a count or carves a region for a row the surface misses, and the surface distance is a report no Trunk rule reads. Survey facts are in the survey's "Trunk" subsection, with the commands that printed them.

### Trunk base

`trunk`, rule `sagittal`, the chain name the consumers read.

- Axis: the natural cubic spline through the bind joints `pelvis`, `spine_01` to `spine_05`, `neck_01` and `neck_02`, parameterised by chord length (the interpolant of least `integral |r''|^2` through the joints: de Boor 1978, A Practical Guide to Splines, ch. IV), continued below the pelvis by its end tangent, the straight line its zero end curvature gives. The anchor is the pelvis joint, the skeleton's root, as the shared method gives it; a station is arc length along the axis from it, negative below it, and a point's station is that of its foot on the axis. A polyline of the joints would turn the normal planes by a jump at every joint, so the trunk's axis is the spline through them, as Module frames and handles allows a part's own curve through the same joints.
- Frame: the named axes at the pelvis are built from joint centres: along, the axis tangent t; lateral, the hip axis (`thigh_l` minus `thigh_r`) made normal to t; forward, t x lateral, so that lateral x forward is t. The key frames follow the shared Representation rule: at the first key, u is the forward axis made normal to the key's plane and v completes it so that v x u is the plane's normal, carried key to key by double-reflection rotation-minimising transport (Wang, Juttler, Zheng and Liu 2008), as the limbs carry theirs; the survey's measure carries the same frame from the pelvis. An angle runs about the axis from u toward v, so the angles 0 and ±180 are the frame's sagittal plane, which on f1 holds every point of the Rise and Neck to Waist courses (survey).
- Key planes: a key lies on the axis's normal plane at its station, in the carried frame. It need not be an observed row's plane: the fit projects every node onto the surface, and the horizontal rows stay observations only. A curve's normal planes meet their neighbours along its polar line, at the radius of curvature along the principal normal (Struik 1961, Lectures on Classical Differential Geometry), so they cross inside the skin only where the skin reaches past it. On f1 the skin stays at least 7.9 mm inside it (survey); the fitter checks the same on every person and stops where it fails.
- Bottom end: `cap.from` is the largest station of the leg root loops' points (-101.07 mm on f1), so the end key's plane lies on the trunk's side of every leg root point. The pole is the shared Caps rule's terminal, the crotch saddle where the trunk's component splits into the legs: the `cap.from` plane is observed on its own with its normal reversed, and its loop round the axis seeds Recovery's terminal (Observation families). `cap.from` is read from the legs' `-root-v3.json` loops, so within Retirement step 1 Method observes the trunk's terminal after the legs' roots. The terminal is not yet observed; on f1 the axis, continued below the pelvis, meets the Rise course at station -112.67 mm and the course's lowest point lies at -113.35 mm (survey). `rho`, the cap keys and their planes follow the shared Caps rule; the trunk's side of the rows below `cap.from` reaches into the cap and shapes it.
- Top end: the neck ring, the key on the plane of the Neck Base course, the anthropometric course round the base of the neck. The course is planar, its points within 0.00 mm of their orthogonal least-squares plane on f1, and the plane crosses each trunk row it meets twice, round the neck (survey); the plane is the course's least-squares plane on every person (the eigenvector of the least eigenvalue of the points' covariance: Pearson 1901, On lines and planes of closest fit to systems of points in space). The key's station is where the axis crosses that plane (537.86 mm on f1). Its axes are the carried frame turned by the least rotation that takes t onto the plane's normal (18.4 degrees on f1), about `t x n`. It is a free key of the trunk fit; the trunk has no `ends` entry. The head base holds a copy (`ends.bottom = {owner: "trunk", end: "top"}`) with the trunk's N, and `compose` gives the head's first interval the trunk's end slope and curvature. The trunk's natural-spline end condition at its last key (zero second station derivative) is therefore also the head's at the ring. Skin on the trunk's side of the plane is the trunk's, beyond it the head's.
- Keys: the selected number at evenly spaced admissible stations between `cap.from` and the neck ring, never moved to a row (Keys and control counts). A station is admissible by the shared rule: the line its normal plane shares with each end key's plane misses the inside of the end key's loop and of the station's own start loop. The survey measured the same against the trunk rows' nodes near each station: on f1, 28 whole-millimetre stations between 509.00 and 537.00 mm meet the neck base plane (survey). No key sits at a measurement site; #2998 keeps the sites named.
- Storage: as Module frames and handles stores every anchored chain: each key's station, its frame and the pole in the pelvis anchor's coordinates, the coefficients in the key's frame. A later transform moves the anchor, or the joints the axis is built from, and the same rules re-derive the frames; no key is tied to a world height.
- Named axes and joints (Module frames and handles; Integration, Frames, anchors and joints): the named axes are the Frame bullet's along, forward and lateral at the pelvis. The declared joints are `pelvis`, `spine_01` to `spine_05`, `neck_01` and `clavicle_<s>`, as Integration asks; each carries its point, and its station only where its foot on the axis lies between `cap.from` and the neck ring (on f1 `neck_01` lies at station 519.16 mm, below the ring). `neck_02` is the Head's (beyond the ring on f1) and `thigh_<s>` are the legs' anchors, so the trunk reads them without declaring them, each joint being declared by one module only.
- N: the trunk's own search. Its data limit is 4 Gauss nodes per span of the largest loop the partition leaves the base; on f1 the rows no root loop cuts have at most 144 spans, and the fitter prints the limit on every person. The head base takes the trunk's N.
- Start keys: `HumanModuleKeys.ts`'s rule, the trunk's own nodes of the row nearest each key, its gaps closed by chords, moved along the axis tangent into the key's plane and taken in the key's axes. The start only seeds the first projection.
- `samples`: `2N`, as the shared Module data format leaves it to Integration.

### Data partition

Decided before any fit, by the observations' topology and the trunk's frame (a node's station and angle), never by a residual. A node takes the first row of this table that holds it:

| Observation | Module |
| --- | --- |
| the saved loft (`hermite-curves.json.gz`) | none: its rows, 10 mm apart (survey, Observations), observe skin the trunk family observes every 2 mm from the welded body and head meshes, and counting both would weigh that skin twice under the section weights |
| a row's arcs beyond the neck base plane | none: the head's families observe the neck there (Head), and counting both would weigh it twice |
| the arm and leg families' planes before their root keys, whose loops join the trunk | none of them the trunk's: the trunk rows observe that skin; the Arm's and Leg's partitions decide the limbs' share |
| a row's arcs distal of a root loop, cut by intersection with no tolerance: the root loop meets the row's plane at points of the line the two planes share, and each such point cuts the row at the row's crossing of the root's plane nearest to it (on f1 each arm cuts the rows 1277.10 to 1329.10 mm, each leg 807.10 to 813.10 mm) | that limb (Arm, Leg) |
| a row's arcs on the arm side of that side's armscye plane, in the run of rows the plane crosses from the axilla's row (on f1 1275.10 to 1409.10 mm) | the arm's strip region (Arm) |
| a row's nodes in a relief region (below) | that relief; the base is fitted without them |
| every other part of the trunk rows | the trunk base |

The root cut alone leaves the trunk's side of the row changing at once at the axilla: between 1275.10 and 1277.10 mm on f1 its lateral reach (|z|, v being `(0, 0, 1)` at every joint there) goes from 149.4 / 149.5 to 156.1 mm and its length from 883.3 to 955.4 mm, and above it the reach follows the tilted root plane outward to 184.6 / 185.2 mm at 1299.10 mm. One section per station cannot hold that corner without a lump. The arm's boundary on the trunk is taken at the armscye, the armhole loop of anthropometry and garment sizing round the shoulder joint, over the shoulder and through the axilla (ANSUR II defines the acromion and the axilla: Gordon et al. 2014, NATICK/TR-15/007; [ANSUR II](sources/ansur-ii.md)). The observations give three of its points: the shoulder point (the Across Shoulder course's end), the anterior axillary fold (the Front Interscye Length course's end) and the axilla, the observed saddle where the arm joins the trunk (the point farthest along that side's frame axis, v or -v, of the last row the root loop does not cut). No cited curve gives the armscye, so the plane through these three landmarks stands for it: a landmark construction, stated as such. On f1 it crosses only the rows 1275.10 to 1409.10 mm, so it bounds the shoulder; the fitter checks on every person that its run of rows from the axilla's row is the only one it crosses, and stops otherwise. The plane through `measureIdentity.ts`'s acromion instead of the course's shoulder point crosses 289 rows from 807.10 mm, 234 of them below the axilla, so it cuts through the torso and bounds nothing (survey). With the armscye cut the reach is 153.7 / 154.3 mm at 1277.10 mm, stays 152.4 to 154.6 mm to 1335.10 mm and falls to 130.5 mm at 1411.10 mm, the first row the plane does not cross. A step remains at the saddle: the rows 1277.10 and 1279.10 mm cross the plane four times, through the axillary hollow. That is the saddle's change of topology between horizontal rows, which no plane removes; the base's selected smoothing spreads it, and the arm's strip covers the axilla from its trim.

Relief regions, in the trunk's frame (a node's station and angle). A course bound is the course's own curve in those coordinates, a point bound its station or angle:

| Relief | Stations | Angles |
| --- | --- | --- |
| `breast_<s>` | from the Underbust course to that side's anterior axillary fold (on f1 257.02 to 294.31 mm, and 411.53 mm) | from the front of the sagittal plane (0) to the fold's angle (±72.4 on f1) |
| `buttock_<s>` | from the trunk's bottom to the High Hip course (on f1 60.10 to 103.71 mm) | from the Hip course's point farthest along that side's v or -v (87.2 / -85.8 on f1) to the back of the sagittal plane (±180) |

On f1 the breast regions hold no sample of the armscye cut and no sample of the arm root loops; the leg root loops reach into the buttock regions at their bottom, where the leg arcs leave first by the table's order (survey). The fitter checks the breast regions against the armscye and arm root regions on every person and stops on any overlap.

### Reliefs

Four `IAutoMovieHumanRelief` on `trunk`: `breast_l`, `breast_r`, `buttock_l`, `buttock_r`, `_l` on the side of the skeleton's `_l` joints, toward which the lateral axis points (Frame). Each is fitted over the fitted base by the shared relief method: every node the partition gives the base or that relief whose foot on the base falls in its window, the net counts by the search, the axis by the cone of normals.

- Window: the smallest station range on the chain holding the region's bounds, the chain's station being the axis station from `cap.from` up and the cap formula's below it, so a bottom at the pole takes the pole key's station. The lateral phase is that of the lateral landmark's foot on the fitted base. The medial phase is that of the base's point in the frame's sagittal plane (angle 0 or ±180) on the window's side, taken over the window's stations from `cap.from` up at its extreme toward the window (below `cap.from` the cap's sections shrink to the pole and their phases carry no midline), so that a left and a right window never overlap and no two reliefs share an observation. The three zero rings lie inside the window.
- Nodes of a region whose foot falls outside its window are dropped and counted (reason: relief region outside its window).
- By the window rule, the buttock windows reach down to the cap's pole key, so each buttock relief keeps its height down to the leg root loops and vanishes inside the leg trims. The fitter reports the relief's largest height on the cap outside every leg trim.
- Inframammary fold: inside the breast window. On f1, along the apex's azimuth, the rows' radius begins to rise between 1205.10 and 1211.10 mm, above the Underbust course. The fold is the relief's field over the base, its slope and curvature continuous at the window's edge by construction; no fold curve is imposed. If no feasible axis exists, the breast is no height field and becomes an appendage (Surface composition); the Trunk plan then returns to step 2 for it.
- Gluteal fold: not a trunk feature. Its crease lies at or below the leg root loops (survey), so it is the leg module's; the trunk meets the leg at the leg root loop (stations -121.94 to -101.07 mm on f1) through the Leg's strip.
- Intergluteal cleft: the two buttock windows meet at the back midline, where each relief vanishes with its slope and curvature, so the cleft is the valley between the two fields over the base.
- Nipples and genitals: not modelled (Human skill rules). Nothing in this plan keys, counts or carves for them; their observations stay with the relief or the base whose region holds them, and the distance report shows them.

### Changes to `fitTrunkBase.ts`

`fitTrunkBase.ts <alias dir>` builds the trunk's geometry, calls the shared driver and writes the fit; its doc comment (`:1`-`:38`) is rewritten to state that geometry.

- Keeps: the joint read (`:71`), the course reader (`:72`-`:76`), the root loop reads (`:122`-`:127`, read from the `-root-v3.json` files of Observation families) and the vector helpers (`:586`-`:604`).
- Adds: the pelvis anchor (`HumanModuleAnchor.ts`); the axis spline, its rotation-minimising frame from the hip axis, stations and angles of points; the named axes and declared joints; the neck base plane and the neck ring's station and turned frame; `cap.from` from the leg root loops, its plane handed to Method's terminal observation (Observation families), and the pole read from that terminal record; the admissible stations and the normal planes' regularity check, both stopping on failure; the partition above (root cuts, armscye planes with their run check, relief regions in the frame, with node counts per module); the relief regions' landmarks for `fitTrunkReliefs.ts`; the strips record for the four limbs (Strips); the call to the shared driver; the conversion of the fit to the anchor's frame; and the output below.
- Replaces: the bind axis polyline continued vertically (`:78`-`:94`) by the axis spline, the crotch pole at the Rise course's lowest point (`:129`-`:130`) by the terminal, and the starting chain of horizontal keys with its `cap` (`:198`-`:208`) by the start keys and the cap keys of `HumanModuleKeys.ts` in the key frames.
- Deletes: the order argument and N 96 or 128 (`:54`-`:56`); `CYCLES`, `ROWS`, `STEP`, `COLUMNS`, `REACH`, `CAP`, `NEAR`, `RINGS` (`:57`-`:66`); the `-128` output name and the `composed` switch (`:67`-`:68`); the world-height calibration import and every read of it (`:41`, `:138`-`:145`, `:156`, `:170`-`:180`); the neck ring from `head-base-biweight.json` (`:121`); the end key at the leg roots' highest point and `sp` (`:128`, `:131`-`:133`); the identity's sites and `keyStations` (`:146`-`:169`); the `sin(theta)` cap keys (`:181`-`:197`); the 8-per-span `points` (`:96`-`:117`) and the cloud with the saved loft (`:210`-`:230`), replaced by `HumanObservation.ts`; the starting chart, `RADIUS`, `CELL`, `projected` and `carried` (`:232`-`:270`); the carried root regions, the breast discs, the buttock polygon, their windows and the mask (`:272`-`:407`); the biweight fit by GCV (`:409`-`:424`); the check mode and the output's `scale`, `threshold`, `radius`, `rms`, `bands`, `regions` and `check` (`:426`-`:524`); `periodicKnots` and `periodicSpline` (`:526`-`:584`).

### Changes to `fitTrunkReliefs.ts`

`fitTrunkReliefs.ts <alias dir>` reads `trunk-base.json`, builds the four windows from the landmarks' feet on the fitted base, fits each relief by the shared relief method and writes `trunk-reliefs.json`; its doc comment (`:1`-`:20`) is rewritten to match. It deletes `SPACING` and `RINGS` (`:31`-`:34`), the base fit's `radius` and the `composed` switch (`:40`-`:41`), its copy of the bind axis, loop sampling and cloud with the saved loft (`:44`-`:105`), the region-box windows grown by 18 mm (`:107`-`:121`), the three-relief list with its bottom flag (`:122`-`:127`), the `HumanReliefFitting.crossValidated` call (`:128`) and the bare-array output (`:137`).

### Outputs

- `.shots/claude-scratch/trunk-base.json`: the chain (`trunk`, its `anchor`, order N, `sagittal`, `samples` `2N`, keys with their stations and frames, `cap` `{end: "bottom", from, pole}`, all in the anchor's coordinates, which the record states for Integration's Export 5); the frame record (the joints and the hip axis it is built from, the named axes, the neck base plane, `cap.from`, the terminal seed and the pole); the strips record for `arm_<s>` and `leg_<s>` (each root loop, its trim direction, the labels of its strip's observations); the partition record (rows used, rows without a loop, node counts per module, each root cut's rows, each armscye plane's origin, normal and rows, each relief region's stations, angles and landmark points); the shared selection record; the `distance` record.
- `.shots/claude-scratch/trunk-reliefs.json`: `{reliefs, windows, selection, distance}`, the reliefs in the order `breast_l`, `breast_r`, `buttock_l`, `buttock_r`, each window with its landmarks' feet.
- `reportDistances.ts` lists both fits; no Trunk rule reads the distance.

### Defects removed by cause

| Survey defect | Removed by |
| --- | --- |
| abdominal band at about 1040 mm | no layer is fitted to a row, so the navel at the front midline is written into no whole section: the keys are few and evenly spaced by the selection, and the navel is no key and no region; the measurement law's waist knot retires with the warp (Retirement step 3) |
| horizontal gluteal fold | no contact ring: the trunk closes by its cap to the crotch, the leg roots on its root loop through the Leg's strip, and the fold's crease is the leg module's |
| armpit lump | the arm's lobe leaves the base by the root cut and the armscye cut; the base bridges the shoulder with its least-rough continuation, the arm's strip covers the axilla, and no event ring or `ringBlend` remains (Retirement); the saddle's remaining step is spread by the base's selected smoothing, not by a repair |
| thigh line at the crotch ring | the same as the gluteal fold: no ring; the trunk's side of the join is the base's C2 cap and its exact jets at the leg trims |
| vertical striations on the backs of the thighs, the trunk's share | N from the selection with the harmonic-acceleration penalty, no 256-point section fitted to a row |
| calibration filling the intergluteal cleft | no contact low-pass (Retirement); the cleft is the valley between the buttock reliefs |
| keys at sites, start keys and neck ring from the world-height calibration | keys by the selection, start keys from the trunk's own rows, the neck ring on the Neck Base course's plane |
| a module anchored to world height | the pelvis anchor and the trunk's frame from the spine and hip joints; its ends from the leg root loops, the crotch terminal and the Neck Base course; its regions in frame coordinates (Order 2) |

### Requests

- Method and Head: the head base takes the trunk's N, since `compose` refuses a shared key of another control count (`AutoMovieHumanFeatureChain.ts:225`), and the trunk's search scores the trunk alone. Whether the head base needs a larger N is a joint decision, not a change to the trunk's search.
- Head: the neck ring is the trunk's key on the Neck Base course's plane, at the axis station where the axis crosses it, its frame the trunk's carried frame turned onto that plane; the head families' nodes on the trunk's side of the plane are trunk skin, and the trunk rows' arcs beyond it are left to the head's families.
- Arm: the arm's strip region on the trunk is the armscye arcs and the root-cut arcs. On f1 the arm root loop's lowest point lies 1.68 / 1.79 mm on the trunk's side of the armscye plane, so at the axilla the strip narrows to the gap between the trim and the root loop; whether the arm's root key moves distally is the Arm plan's.
- Leg: the rows' arcs distal of the leg root loops are the leg's, and the gluteal fold's crease lies on the leg.
- Integration: `trunk` spans what `trunk`, `upper` and the bottom of `head` spanned, and `upper` vanishes.

## Head

## Hand

The Hand part fits, on each side, one palm, five digits and five digit strips by the shared method, and owns the wrist key. Every module is placed by the bind joints and the observation families' topology: the wrist plane, the separated root loops, each digit's run of sections and the mesh components the roots bound. Its counts and smoothing come from the shared selection, so nothing below adds a key, raises a count or carves a region for a row the surface misses, and the surface distance is a report no Hand rule reads. Survey facts are in the survey's "Hand" subsection, with the commands that printed them. Every rule below is stated for any bind skeleton and any observation family; f1's plane indices and lengths only illustrate it.

### Frames

Every Hand module lives in its own frame, derived from the bind skeleton by one rule, and states its stations, keys, cap, pole and trims in that frame, so a later transform or deformation of a module (a stylised palm, a longer finger) acts on one frame and its contents (the shared method's Module frames and handles).

- Anchor: the shared method's, the bind frame of the joint at which the module's axis begins: `hand_<s>` for the palm, `<digit>_01_<s>` for a digit. Stations run from that joint along the module's axis; key frames and the pole are stored in the anchor's coordinates (`HumanModuleAnchor.ts`).
- Named axes (the shared method's: along, front, lateral), built from bind joint centres in the anchor's coordinates:
  - Palm, along: the hand bone's direction, `hand_<s>` to `middle_01_<s>`.
  - Palm, front: dorsal, the unit normal of the plane through the wrist spanned by the along axis and the knuckle line (`index_01_<s>` to `pinky_01_<s>`, the line through the second and fifth heads that the identity's metacarpal heads site takes, `measureIdentity.ts:553`-`:555`), its sign the one that puts `thumb_01_<s>` on its negative side. The thumb's carpometacarpal joint sits on the palmar side ([Hand](anatomy/hand.md), Knuckle arc, palm and thumb), so the other side is dorsal. The rule reads no side name, so both mirrored hands get the same anatomical axes (on f1 `thumb_01` lies 17.68 mm from that plane, and every finger's `_02` and `_03` lies on the same side, 13.02 to 35.78 mm; survey).
  - Palm, lateral: along x front.
  - Digit: along is its first bone's direction, `_01` to `_02`; front and lateral are the palm's carried onto it by rotation-minimising transport (Wang, Juttler, Zheng and Liu 2008), as the shared method's child module takes its parent's.
  - Palmar, for `AutoMovieHumanSkinLandmarks` and the nails, is minus front.
- Stations: arc length from the anchor joint along the module's axis curve (its bone polyline, as `planBodySections.ts` builds it).
- In-plane axes of every key: the shared Representation rule, `u` the front axis made normal to the key's plane at the module's first key, carried key to key by rotation-minimising transport. Phase 0 is dorsal on every Hand module of both hands.
- Declared joints: Each bind joint is declared by one module only, the one whose frame it anchors or whose chain it lies on: the palm declares `hand_<s>`, each digit its `_01` to `_03` (the palm's named axes read `index_01`, `middle_01`, `pinky_01` and `thumb_01` without declaring them). Each declared joint carries its point in the anchor's coordinates and its station where its plane lies in the module's station range (the planner puts every joint's centre plane among its planes, `planBodySections.ts:190`-`:196`). Each fit writes its anchor, named axes and declared joints beside its world chain; the exporter converts keys and pole into the anchor's frame (Integration, Export).

### Palm

`hand.<side>.palm`, rule `sagittal`. The name keeps the `hand.<side>.` prefix that `AutoMovieHumanNail` and `AutoMovieHumanSkinLandmarks` read.

- Planes: the arm family's plane function (shared Representation) from the plane through the wrist joint to the plane through `middle_01`, the hand bone's end and the family's last plane (on f1, indices 129 and 150 of 151). The observed planes stay in the registered world frame, as every observation does; the key planes the function gives are stored in the anchor's coordinates.
- Bottom end, the wrist key: the palm's first key, on the plane through the wrist joint, normal to the bisector of the forearm and hand bones, at station 0. It is a free key of the palm fit, fitted to the palm's observations; the palm has no `ends` entry. The Arm holds a copy (`ends.top = {owner: "hand.<side>.palm", end: "bottom"}`) with the palm's plane and N, and `compose` gives the arm's last interval the palm's end slope and curvature, signed into the arm's own station (`AutoMovieHumanFeatureChain.ts:217`-`:251`), so the two modules keep their own station origins. The palm's natural-spline end condition at its first key (zero second station derivative) is therefore also the arm's at the wrist.
- Top end, the end key at `cap.from`: the last station whose section is wholly the palm's own skin (shared Caps), taken from the observations: the station of the last arm-family plane in the palm's range that holds no node on the skin component (Data partition) of a digit rooted across the palm's end, a digit whose root loop reaches past the family's last plane (through `middle_01`). A digit whose root loop lies wholly before that plane roots on the palm's side, and its skin is a hole in the palm's sections that its trim covers, as an arm roots on the trunk's side; on f1 that is the thumb, while the pinky's root loop reaches from 6.5 / 6.4 mm before the last plane to 1.6 / 1.7 mm past it (survey). The end key lies in the plane function's plane there. The metacarpal heads' plane is an observation of the palm, never a key, and `metacarpalHeads` stays a named station for #2998: on f1 the family's last six planes meet it inside the skin (survey), so as an end key it would fold the surface against keys at their stations.
- Cap: the shared Caps rule. The pole is the palm's terminal, Recovery's first critical event past the palm's loop in the end key's plane that splits its source component, the first web saddle beyond the palm, stated in the anchor's coordinates; `HandGeometry.ts` names that plane for Method's observation run (shared Observation families, Continuation). The pole is a point of the skin between two digit roots, so it lies on the palm's cap among the trims, where the webs are. A palm whose terminal is a maximum, no splitting event, has no digit beyond it; `fitHand.ts` stops and reports it, as the shared Caps rule stops on a terminal that is neither. The palm's observations past `cap.from`, its own planes to the family's last plane and the joined skin of the digits' planes before their roots, shape the cap. On f1 the palm skin's farthest observed point along the family's last plane's normal lies 19.9 mm past that plane (survey); the terminal is not yet observed.
- Thenar: joined skin proximal of a digit's separated root belongs to the palm, whatever digit it surrounds. On f1 the thumb separates at its `thumb_02` plane, so the skin along `thumb_01`-`thumb_02` and the first web space, the thenar, is palm. The thenar is the thumb's pyramidal base, one of the hand's two masses ([Hand](anatomy/hand.md), Form); the palm's sections carry it.
- Keys: the shared rule, the selected number at evenly spaced admissible stations between the ends, each in the plane function's plane there. The plane function turns across the wrist within the planner's half-width (`planBodySections.ts:186`) and is parallel past it; the admissibility test checks every station all the same. The data limit is the palm's observed sections between its ends.
- N: the palm's own search; its data limit is 4 Gauss nodes per span of the largest loop among the palm's sections (on f1 46 / 45 spans, a thumb section before its root). The Arm takes the palm's N.

### Digits

`thumb.<side>` and `finger.<side>.<index|middle|ring|little>`, rule `sagittal`: the consumers' names (`AutoMovieHumanJointCentres.ts:244`, `:280`; `AutoMovieHumanNail.ts:100`-`:101`; `AutoMovieHumanSkinLandmarks.ts:107`-`:108`), not `fitAppendage.ts:76`'s family names. Each digit module declares its chain name in `HandGeometry.ts`'s table of digits (the family `pinky` declares `finger.<side>.little`); no rule reads a name to decide geometry.

- Planes: the digit family's plane function, normal to the bone and turning only at `_02`, within its half-width (`planBodySections.ts:186`); past the turn it is parallel. Stations, named axes and in-plane axes are as Frames states.
- Bottom end: the separated root of the shared method's Roots (`-root-v3.json`), the first plane whose loop winds neither round the palm axis's crossing nor round the crossing of any other digit's bone polyline (`_01`, `_02`, `_03` and the last bone continued by its own length, as `planBodySections.ts:119`-`:126` builds it). On f1 it is plane 22, 8, 10, 11 and 7 for thumb to pinky on both sides (survey). It is a free key, joined to the palm by the digit's strip. The chain runs from root to tip, so the web is its first station and the tip its pole; the joint-centre rules that take the web at the last station are re-pointed by Integration (Requests).
- The run: the digit's `-v3` family from its root, followed by succession and continued to the terminal (the shared method's Observation families).
- Top end: the cap of the shared method at the observed tip. `cap.from` is the run's last plane; the pole, in the anchor's coordinates, is the digit's terminal by the shared Caps rule, seeded with the run's last loop: the maximum of its source component past that plane, the fingertip, single-tip qualified, when no splitting event comes before it. Every point of a loop lies in its plane, so the farthest point of the run alone would lie in the end plane itself (0.0 mm past it on all five digits, survey) and give the cap no height.
- Preconditions: the `-v3` families, their `-root-v3.json` files and their terminals, which Method observes in Retirement step 1. On the current files the thumb's tip is unobserved up to 12.3 mm and the pinky's up to 5.7 mm, and every cap would close at its own end plane; no digit is fitted on them. The palm waits for the same step: its partition reads the separated roots of `-root-v3.json` (three `-root-v2` loops hold a neighbour's skin) and its pole is a terminal, so the palm and then the Arm fit after it. Within that step the palm's terminal comes after the digits' roots: `HandGeometry.ts` derives the palm's `cap.from`, and so the plane that seeds the palm's terminal, from the separated roots and the skin components they bound.
- Keys: the shared rule, evenly spaced admissible stations between the ends, each in the plane function's plane. N: the digit's own search, its data limit 4 Gauss nodes per span of its largest run loop.
- Nails: no skin module carries nail geometry. `AutoMovieHumanNail` lays its plates on the distal dorsal skin of the chains its pattern names, which the names above match; cuticle folds stay an appearance question outside #2997.

### Digit strips and webs

One `IAppendage` per digit on the palm (`chain` the digit, `end` bottom, `base` `hand.<side>.palm`), fitted by the shared strip method (`HumanStripFitting.ts` with `fitStrip.ts`) after the palm and the digit.

- Trim: the separated root loop intersected with the fitted palm along its root plane's normal, the bone's direction at the root, by the foot rule's line intersection. Its region is the part of the palm's chart the trim encloses on the side the bone line meets; a trim that winds once round the palm's pole is stored with its winding and encloses the chart beyond it toward the pole. Two trim regions that overlap stop the fit: a junction joins two surfaces only ([Surface composition](techniques/surface-composition.md)).
- Webs: the palm between two trims. The partition gives every joined section's skin outside the digits' components to the palm, so the web saddles, the knuckles and the palmar pads between the roots shape the palm's cap; a web is no separate surface, "a web the palm between two finger roots" ([Surface composition](techniques/surface-composition.md)).
- Strip observations: none. The partition labels each node once, before any surface exists (shared Observations and weights), and it gives every joined node to the palm, so no section crosses a strip as the strip's own. The strip then has no interior row (the shared rule: no crossing section, no interior row) and is the quintic blend of the palm's and the digit's edges; with no observation its objective is constant, so its reach stays at the bracket's start, 1, the straight blend (shared Strips).
- Band: the palm owns the joined skin up to each root, so the trim lies close to the root loop and the strip is narrow. The shared strip method reports each column's band width and stops on a crossed band (shared Strips).
- Record: the palm fit's `strips` record holds, per digit, the separated root loop, the trim direction and the strip's observation labels (none), which the shared strip method reads.

### Data partition

Decided before any fit, by the observation families' topology and the mesh components the separated roots bound, never by a residual and never by a surface:

| Observation | Module |
| --- | --- |
| arm family planes proximal of the wrist plane | the Arm |
| the wrist plane, the palm's key | the palm |
| arm family planes distal of the wrist plane, the heads plane, every digit's planes before its separated root | the palm, except the nodes on a digit's skin component: those belong to no module and are counted |
| a digit's `-v3` run, from its separated root | that digit |
| a module's terminal | that module's pole |
| loops after a digit's run | none |

A digit's skin component is the connected part of the body mesh (`body-native.json`, registered as `observeBodySections.ts:105` does and welded by position as `:95`-`:104` does) lying strictly distal of its separated root plane that holds the digit, seeded at the mesh vertex nearest the midpoint of its `_02` and `_03` joints. A node takes the label of its nearest mesh vertex. On f1 the five components hold no other digit's seed and do not overlap; the palm planes hold thumb and pinky skin past their roots, and the thumb's oblique sections the ring's and pinky's (survey). Those nodes are the digit's skin observed by a plane of another family; the digit's own run observes the same skin at its family's spacing (2 mm on f1), so they stay out of every fit, as the trunk partition leaves the saved loft out, and the partition record counts them.

### Files

- `HandGeometry.ts` (new, Hand): one side's joints, anchors, palm and digit frames with their roles, declared joints, the wrist key's plane, the palm's stations, `cap.from` and admissible stations, the end planes that seed the terminals, the separated roots read from `-root-v3.json`, the digits' runs and stations, the skin components, the chain names, the partition above and the `strips` record, exported for `fitHand.ts`.
- `fitHand.ts` (new, Hand): `fitHand.ts <alias dir> <l|r>` fits the palm, then the five digits, by the shared driver, and writes their fits with the `strips` record.
- Digit strips run through Method's `fitStrip.ts <alias dir> <digit>_<s>`, which reads the palm fit's `strips` record (shared Strips).
- The palm branch of `fitBodyBase.ts` and the digit branch of `fitAppendage.ts` retire: their geometry moves to `HandGeometry.ts`.

### Outputs

`.shots/claude-scratch/palm_<s>-base.json` (chain `hand.<side>.palm`, its first key the wrist key the Arm reads, as `fitAppendage.ts:145`-`:147` reads it now), `<digit>_<s>-base.json` (chains `thumb.<side>`, `finger.<side>.<k>`) and `<digit>_<s>-strip.json`, the file names `exportModules.ts:107`-`:108`, `:164`, `:172` reads. Each holds the module's anchor joint and bind frame, its named axes and declared joints with their stations in the anchor's coordinates, the frame its keys and pole are given in (the world, which Integration's Export 5 converts), the shared `distance` record, the selected counts and smoothing parameters with their scores, and the partition's node counts per module and per reason, so `reportDistances.ts` lists all 22 Hand fits. The distance is a report: no Hand rule reads it.

### Defects removed by cause

| Survey defect | Removed by |
| --- | --- |
| web creases and palm ringing | no contact ring and no world-height palm: the webs are the palm's cap between the trims, fitted to the joined skin with the harmonic-acceleration penalty and selected counts; the contact low-pass and the event join retire (Retirement) |
| thumb rooted in the wrist ring | the thumb is an appendage on its separated root (on f1 its `thumb_02` plane), its strip trimmed on the palm; the wrist is the palm's own key |
| fingertip shape from repairs | every digit an appendage with a fitted cap to its observed tip, no `sin(theta)`; `domeBase` retires (Retirement) |
| root loops holding a neighbour's skin | the separated root, tested against every other digit's bone as well as the palm axis (shared Observation families, Roots) |
| digit tips unobserved | the `-v3` digit families, followed by succession and continued to the terminal (shared Observation families) |
| a cap closing at its own end plane | the pole at the terminal, the component's maximum past the run's last loop, so the pole stands past the end plane |
| palm data holding digit skin | the skin components: digit skin in a joined section leaves the palm by topology, not by a mask |
| palm keys crossing the end key | the palm's end key lies in its own plane function's plane at `cap.from`, its keys only at admissible stations (shared Keys and control counts); the heads plane is an observation |
| the palm's distal closure is not the skin's | the shared cap to the palm's terminal, the first web saddle, its keys fitted |
| digit regions by the cell rule and a mask; trims by the same rule | trims by line intersection with the fitted palm; the partition by topology; no mask, no robust weight |
| names missing every consumer | chains `hand.<side>.palm`, `thumb.<side>`, `finger.<side>.<k>`; Integration re-points the web direction and the joint centres |
| index and ring fingertip sites on a neighbour | outside the Hand fits: the identity's definition, #2998 (Requests); no Hand rule reads a fingertip site |
| nails without cuticle folds | outside #2997: an appearance rule; no skin module carries nail geometry |

### Requests

- Method: the shared method now carries what the Hand asked of it (the `-v3` families with succession, continuation and terminals; the sibling-bone roots in `-root-v3.json`; the terminal as every cap's pole; the strip inputs from the parent's `strips` record with the band report). The Hand reads them as Digits, Digit strips and Files state, the empty strip's reach included (shared Strips).
- Arm: the wrist key is `palm_<s>-base.json`'s first key, on the plane through the wrist joint, owner `hand.<side>.palm`, end `bottom`; the arm takes the palm's N; the arm's observations end at the last family plane proximal of the wrist plane. The palm's stations start at 0 at the wrist joint, so `fitAppendage.ts:147`'s test that the owner's first key stands at the arm's own station of the wrist plane no longer holds; `compose` signs the owner's derivatives into the sharer's station and needs no common origin.
- Foot: the toes' skin components cite the Hand's digit rule, but the Hand seeds a component at the mesh vertex nearest the midpoint of the digit's `_02` and `_03` joints (the rule the survey measured), not at the terminal; the Foot's seed at the toe's terminal is its own rule and should be cited as such, or the two parts agree on one seed.
- #2998: `measureIdentity.ts:447`-`:458`'s fingertip lies on a neighbour for the index and the ring; `handLength` and `thumbLength` read only the middle and the thumb.
- Integration: the joint centres its re-pointing takes from declared bind joints (`<s>Hand` from `hand_<s>`, the thumb and finger bones from `_01` to `_03`, the tips from the digits' cap poles) need from the Hand exactly the declared joints of Frames and the poles of Digits; `AutoMovieHumanSkinLandmarks` (`:106`-`:141`) reads the Hand chains by the names above and its palmar direction as minus the palm's front axis; `AutoMovieHumanNail` belongs in the survey's Couplings list.

## Arm

## Foot

The Foot part fits, on each side, one foot base, five toes and five toe strips by the shared method, and owns the ankle key. Every module is stored in the frame of the bind joint where its axis begins, and every station, key plane, pole and trim is stated relative to it; its anatomical directions come from the bind joints, and the observation families' topology and the toes' skin components place the rest. The rules hold for any body with the same skeleton; f1's numbers below only illustrate them. Counts and smoothing come from the shared selection, so nothing below adds a key, raises a count or carves a region for a row the surface misses. Survey facts are in the survey's "Foot" subsection, with the commands that printed them.

### Module frames

Every Foot module is stored in its anchor's frame by the shared "Module frames and handles": the foot's anchor is the bind frame of `foot_<s>`, where its axis begins, and each toe's the bind frame of its `_01`. Stations, key planes, the pole and the declared joints are stated relative to that anchor, so a later transform or deformation of a module (a stylised foot, a longer toe) acts on one frame and its contents. Inside its module the Foot also needs anatomical directions the bind affine does not name (which way is dorsal, which side is medial). It builds them from joint centres of the bind skeleton (`HumanBodySkeleton.read`) by cross products, the way the ISB segment coordinate systems are built from anatomical landmarks (Wu et al. 2002, ISB recommendation on definitions of joint coordinate systems of various joints for the reporting of human joint motion, part I: ankle, hip, and spine, Journal of Biomechanics 35(4)). No direction comes from the world.

- Foot axes: `e1`, along the module, is the foot bone, the unit vector from `foot_<s>` to `ball_<s>`. `e3` is the ankle's bend axis, the unit cross product of the calf bone (`calf_<s>` to `foot_<s>`) and `e1`; it is defined while the two bones are not parallel (on f1 they bend 65.72 degrees). `e2 = e3 x e1` points to the dorsum. The axes are right-handed on both sides, so `e2` mirrors between the sides as the body does and `e3` points to the body's left on both, lateral on the left foot and medial on the right (`foot-frames.txt`: on f1 `e2` is (0.442, 0.897, ±0.020)).
- Toe axes: `e1` is the toe bone, `_01` to `_02`; `e2` and `e3` are the foot's, carried onto it by the least rotation that takes the foot's `e1` onto the toe's (one step of rotation-minimising transport), as the shared Named axes carry a child's from its parent's.
- Roles, the shared Named axes: `e1` along the module (the axis leaving the anchor), `e2` its front (dorsal), `e3 = e1 x e2` lateral.
- Stations are arc lengths from the anchor along the bind joints' polyline: for the foot `foot_<s>` to `ball_<s>`, negative toward `calf_<s>`; for a toe `_01` to `_02` and on along that bone, as `planBodySections.ts:119`-`:126` extends it. The observation families' plane origins lie on these polylines.
- In-plane axes: the shared Representation's rule, the first key's u the front axis `e2` made normal to the key's plane and carried key to key by rotation-minimising transport. Phase 0 is therefore dorsal on every section of the foot and of each toe, whatever u the observation planner chose (`planBodySections.ts:144`-`:148` takes world forward or up). On f1 the ankle key's u has a dot product of 0.840 with `e2` on both sides.
- Declared joints, as Integration asks: the foot declares `foot_<s>` and `ball_<s>`, each toe its `_01` and `_02`. Each carries its point in the anchor's coordinates and, by the shared rule, its station only where the joint's centre plane lies in the module's station range. The Foot reads that range as the stations from the first key to `cap.from`, where the module's planes are its plane function's; past `cap.from` they are the cap formula's, whose station is no arc length along the axis. Every one of these joints has its centre plane in its family (`planBodySections.ts:193`-`:196` counts planes from each joint). On f1 `foot_<s>` lies at station 0, the ankle key; `ball_<s>` lies 148.98 mm along the foot bone (`foot-survey.txt`) and carries its station when its centre plane lies at or before `cap.from`. A toe's chain starts at its root key, so its `_01` and `_02` carry their stations only when their centre planes lie between the root key and `cap.from`; on f1 every toe's root lies 14.0 to 18.0 mm past its `_01` (`foot-survey.txt`), so `_01` carries its point only.
- The fitters fit in the world. Each fit records its anchor, its axes `e1` to `e3` and its declared joints in the anchor's coordinates beside the world chain, and the exporter converts the keys and the pole by the anchor's rigid transform (shared Module frames and handles; Integration, Export 5). A trim is already in its parent's chart (station, phase), the parent module's own coordinates.

### Foot base

`foot.<side>`, rule `sagittal`, as `fitBodyBase.ts` names it.

- Key planes: the leg's plane function from the ankle plane to the end key's plane at `cap.from` (shared Representation), the planes normal to the bone polyline, turned across the ankle as `planBodySections.ts:186`, `:197`-`:212` turns them; every key, both ends included, lies in that function's plane at its station. The ankle plane is that function's plane at the ankle joint centre, normal to the bisector of the calf and foot bones (station 0). The metatarsal heads' plane (`leg_<s>-heads-planes-v2.json`, the identity's `metatarsalHeads` site plane through the first and fifth heads) is an observation of the foot, never a key: no key sits at a site by rule, and `metatarsalHeads` stays a named station for #2998 (shared Keys and control counts). On f1 the family's last four planes, 140.0 to 149.0 mm past the ankle, meet the heads plane inside the skin (`foot-key-planes.txt`, `foot-survey.txt`), so as an end key it would fold the surface against keys in those planes, as the Hand finds for the metacarpal heads. The leg family's planes observe the foot; the keys need not lie on them.
- Bottom end, the ankle key: the foot's first key, a free key of the foot fit, fitted to the foot's observations; no `ends` entry, since the foot owns it. The Leg holds a copy (`ends.top = {owner: "foot.<side>", end: "bottom"}`) with the foot's frame and N, and `compose` gives the leg's last interval the foot's end slope and curvature. The foot's natural-spline end condition at its first key (zero second station derivative, `AutoMovieHumanFeatureChain.curvatures`) is therefore also the leg's at the ankle. The key is the foot's, stated in the foot frame, so a transform of the foot moves the joint and the Leg's copy follows it.
- Top end: the end key at `cap.from`, then the cap of the shared method. `cap.from` is the last station whose section is wholly the foot's own skin (shared Caps), taken from the observations as the Hand takes the palm's: the station of the last leg-family plane in the foot's range that holds no node on the skin component (Data partition) of a toe rooted across the foot's end, a toe whose root loop reaches past the family's last plane (through `ball_<s>`). A toe whose root loop lies wholly before that plane roots on the foot's side, and its skin is a hole in the foot's sections that its trim covers. The end key lies in the plane function's plane there, and the fitter prints `cap.from` on every person. The cap keys are `round(rho pi / (2 D))` in the cap formula's planes, and the pole is the foot's terminal by the shared Caps rule, stated in the foot frame: the end key's plane is observed on its own and its loop round the foot axis seeds the terminal (shared Continuation); `FootGeometry.ts` names that plane for Method's observation run (Retirement step 1). The first event that splits the forefoot's component is a web saddle, where the toes part, so the pole is that saddle (the shared rule's "first web beyond a palm or a foot"). A foot whose terminal is a maximum, with no splitting event, has no toe beyond it; `fitFoot.ts` stops and reports it, as the shared Caps rule stops on a terminal that is neither. The terminal is observed from the mesh before any fit, so the pole depends on no surface. Skin under a toe's strip is base skin the trim cuts away, so the saddle may lie there. The foot's observations past `cap.from` (its own planes, the heads plane's part beyond it and the joined skin of the toes' planes before their roots) shape the cap.
- Heel: inside the base's station range. The family planes between the ankle plane and the distal end of the ankle's turn (the half-width of `planBodySections.ts:186`) cut the heel from its back down to the floor, so no end and no cap closes it (on f1 the plane 28 mm past the ankle already reaches 0.07 / 0.13 mm above the floor, and the turn ends at 48.0 mm). The heel's upper back, proximal of the ankle plane, lies on the leg's turning planes and is the Leg's partition.
- Keys: the selected number at evenly spaced admissible stations between the ends, each in the plane the plane function gives there (shared Keys and control counts). With both end keys in the function's own planes, two keys cross only where the function's planes meet inside a loop; on f1 no two family planes from the ankle plane on meet inside either loop (`foot-key-planes.txt`), and the fitter tests every station all the same. The data limit is the shared one, the foot's observed sections between its ends.
- N: the foot's own search; its data limit is 4 Gauss nodes per span of the largest observed loop (66 / 68 spans on f1). The Leg takes the foot's N.

### Toes

`toe.<side>.<k>`, the consumers' names (`AutoMovieHumanJointCentres.ts:316`, `:344`; `AutoMovieHumanNail.ts:100`-`:101`; `AutoMovieHumanSkinLandmarks.ts:177`), not `fitAppendage.ts:76`'s family names; rule `sagittal`. `k` is the toe's rank across the foot from medial to lateral, by its `_01` joint's coordinate along the foot frame's `e3` signed toward the other ankle joint centre, the medial side (the hallux 1); on f1 that orders `bigtoe` to `littletoe` as 1 to 5 on both sides, from 26.3 to -42.9 mm (`foot-frames.txt`).

- Sections: the toe's `-v3` family (shared Observation families): its planes, all normal to the toe bone and so parallel, its run kept by topological succession and continued to Recovery's terminal past the planner's last plane.
- Bottom end: the root key (`<toe>_<s>-root-v3.json`), the first plane whose loop winds neither round the foot axis's crossing nor round the crossing of any other toe's bone polyline (shared Roots); a free key, joined to the foot by the toe's strip. The chain runs from root to tip, so the web is its first station and the tip its pole; the joint-centre and nail rules that take the web at the last station are re-pointed by Integration (survey, Foot).
- Top end: the cap of the shared method at the observed tip: `cap.from` the run's last plane, the pole the toe's terminal, its maximum, seeded with the run's last loop (shared Continuation) and stated in the toe frame.
- Precondition: the `-v3` toe families, their roots and terminals, which Method observes in Retirement step 1. On the current `-v2` files the runs of the index, middle, ring and little toes stop 2.5 to 15.2 mm short of the skin, so no toe is fitted on them. The foot base needs from that run the toes' `-root-v3` loops and terminals (its partition's skin components) and then its own terminal, whose seed plane at `cap.from` is derived from those components, so within that step Method observes the foot's terminal after the toes' roots and terminals. It never needs a toe's fit, so the foot and then the Leg can fit before the toes.
- Keys: every station between the ends is admissible, since the toe's planes are parallel and cannot cross; the keys lie at evenly spaced stations in those planes, the data limit the run's observed sections. N: the toe's own search, limited by its largest loop's Gauss nodes.

### Toe strips

One `IAppendage` per toe on the foot base (`chain` the toe, `end` bottom, `base` the foot), fitted by the shared strip method (shared Strips) after the foot and the toe, from the foot fit's `strips` record, which `FootGeometry.ts` writes: each toe's `-root-v3` loop, its trim direction (the root plane's normal, the toe bone) and its strip's node labels.

- Trim: the root loop intersected with the fitted foot along that direction by the foot rule's line intersection, stored in the foot's chart. Its region is the part of the foot's chart the trim encloses on the side the toe's bone line meets; a trim that winds once round the cap's pole is stored with its winding (`IAppendage.winding`) and encloses the chart beyond it toward the pole. Two trim regions that overlap stop the fit: a junction joins two surfaces only (Surface composition).
- Webs: the foot's cap between two trims, shaped by the joined skin the partition gives the foot; a web is no separate surface.
- Strip observations: none. The partition labels every node before any surface exists (shared Observations and weights) and gives the joined skin up to each root to the foot, so no section is a strip's own; the strip has no interior row and its reach stays at the bracket's start, the straight blend (shared Strips), as the Hand's digit strips do.

### Data partition

Decided before any fit, by station in the foot frame, by family and by the mesh components the toes' roots bound, never by a residual and never by a surface (shared Observations and weights):

| Observation | Module |
| --- | --- |
| leg planes proximal of the ankle plane (negative foot station) | not the Foot's: the Leg's and the Trunk's partitions divide them |
| the ankle plane, the foot's key | the foot base |
| leg planes distal of the ankle plane, the heads plane, and every toe's planes proximal of its root | the foot base, except the nodes on a toe's skin component: those belong to no module and are counted |
| a toe's run in its `-v3` family, from its root | that toe |
| a module's terminal | that module's pole |
| loops after a toe's run | none |

A toe's skin component is the connected part of the body mesh (`body-native.json`, registered as `observeBodySections.ts:105` does and welded by position as `:95`-`:104` does) lying strictly distal of the toe's root plane that holds the toe, seeded at the mesh vertex nearest the toe's terminal, its observed tip; a node takes the label of its nearest mesh vertex, the Hand's digit rule. Such nodes are the toe's skin observed by a plane of another family; the toe's own run observes the same skin, so they stay out of every fit and the partition record counts them. `HumanObservation.ts` carries the table as one label per node, and the fit writes the partition record.

### Files

- `FootGeometry.ts` (new, Foot): one side's joints, the foot and toe frames with their declared joints, the ankle plane, `cap.from` and its end plane, the heads plane as an observation, the stations, the terminal seeds and poles, the toe ranks, runs and roots, the toes' skin components, the chain names, the partition above and the foot's `strips` record, exported for `fitFoot.ts`.
- `fitFoot.ts` (new, Foot): `fitFoot.ts <alias dir> <l|r>` fits the foot base, then the five toes, by the shared driver, and writes their fits with their frame records.
- Toe strips run through Method's `fitStrip.ts <alias dir> <toe>_<s>`, which reads the foot fit's `strips` record (shared Strips).
- The foot branch of `fitBodyBase.ts` and the toe branch of `fitAppendage.ts` retire: their geometry moves to `FootGeometry.ts`.

### Outputs

`.shots/claude-scratch/foot_<s>-base.json` (chain `foot.<side>`, its first key the ankle key the Leg reads), `<toe>_<s>-base.json` (chain `toe.<side>.<k>`) and `<toe>_<s>-strip.json`, the names `exportModules.ts:107`-`:108`, `:165`, `:172` reads. Each holds the module's anchor joint and bind frame, its named axes `e1` to `e3` and its declared joints with their points and the stations Module frames gives them, a statement that its keys and pole are in the registered world frame (for Integration's Export 5, which converts them), the shared `distance` record, the selected counts and smoothing parameters with their scores, and the partition's node count per module, so `reportDistances.ts` lists all 22 Foot fits. The distance is a report: no Foot rule reads it.

### Defects removed by cause

| Survey defect | Removed by |
| --- | --- |
| lesser toes shortened, toe tips unobserved | the `-v3` toe families, followed by succession and continued to the terminal (shared Observation families); the toe's pole its terminal maximum |
| the hole in the right index toe's run | the same families: succession keeps the loop that overlaps its predecessor's, wherever the plane's origin falls |
| foot keys crossing the heads plane | the end key in the plane function's own plane at `cap.from`, every key at a shared admissible station; the heads plane an observation, never a key |
| the foot's distal closure inside the middle toe | the foot's terminal, the first web saddle past the end key's loop, its cap keys fitted, no `sin(theta)` |
| toe regions by the cell rule and a mask, trims by the same rule | trims by line intersection with the fitted foot from the `strips` record; the partition by topology, toe skin seen by other families leaving the foot as skin components; no mask, no robust weight |
| axes and phase origin from the world, keys stored in world coordinates | anchors at the bind frames of `foot_<s>` and each toe's `_01` (shared Module frames and handles), stations from the anchors, the exporter storing keys and poles in the anchors' frames (Integration); phase 0 dorsal from axes built from bind joint centres by cross products |
| names missing every consumer | chains `foot.<side>` and `toe.<side>.<k>`, the toe's `k` its medial-to-lateral rank; Integration re-points the web direction |
| left and right trees differ, toe tips and webs from repairs | both sides fitted by the same rules on their own observations, every toe an appendage with a strip and a fitted cap; the world-height foot and its repairs retire (Retirement) |

### Requests

- Method, observation run (Retirement step 1): the foot's terminal seed is its end key's loop, the plane function's plane at `cap.from` observed on its own (shared Continuation), which `FootGeometry.ts` names once the toes' `-root-v3` loops and terminals exist, so the foot's terminal comes after the toes' within that step; the toes' seeds are their `-v3` runs' last loops (Toes, Top end).
- Method, Keys and control counts: its example of "a distal end on an oblique site plane", the foot's planes 244..247 at the metatarsal heads' plane, no longer describes a Foot end, since the foot's end key lies in its plane function's plane and the heads plane is an observation (Foot base); the survey fact stands as the reason the heads plane is no key.
- Integration, anchors, named axes and joints: the Foot's anchors are the bind frames of `foot_<s>` and each toe's `_01`; its named axes are `e1`, `e2`, `e3` of Module frames; it declares `foot_<s>`, `ball_<s>`, each toe's `_01` and `_02`.
- Integration: re-point `AutoMovieHumanJointCentres` (ankle, foot radius, toe web direction), `AutoMovieHumanNail`, `AutoMovieHumanSkinLandmarks` and `AutoMovieHumanSkinTone` to the Foot chains, whose names keep the consumers' patterns; `AutoMovieHumanNail` belongs in the survey's Couplings list.

## Leg

## Integration

Integration exports every module region, replaces the world-height calibration by their merge, deletes what Retirement assigns it, re-points every consumer of world-height chain names to the module chains, and audits the render. Survey facts are in the survey's "Integration" subsection, with the commands that printed them. Every rule below reads a module's own declared names, frame, anchor and joints and its topology (`appendages`, shared ends as continuation events, cap poles), never a person-indexed table, a world height or absolute coordinate taken as an anchor, or a chain orientation assumed by name, so that a module can later be transformed or deformed through its own frame (the owner's Order 2).

### Names and joins

| Module | Chain | Owner of the name | Joins |
| --- | --- | --- | --- |
| trunk base | `trunk`, keys on the normal planes of its axis, the spline through the spine joints, station arc length along it from the pelvis joint | Trunk | owns the neck ring (the key on the Neck Base course's plane); cap at the crotch; arm and leg strips root on it |
| palm | `hand.<side>.palm` | Hand | owns the wrist key (first key); digit strips root on it |
| digits | `thumb.<side>`, `finger.<side>.<index|middle|ring|little>`, root first, cap at the tip | Hand | strips on the palm, `end` bottom |
| foot base | `foot.<side>` | Foot | owns the ankle key (first key); toe strips root on it |
| toes | `toe.<side>.<k>`, root first, cap at the tip | Foot | strips on the foot, `end` bottom |
| arm | `arm.<side>` (gap: Arm not written) | Arm | rooted on `trunk` at its first key (`end` bottom), shares the palm's wrist key at its top |
| leg | `leg.<side>` (gap: Leg not written) | Leg | rooted on `trunk` at its first key, shares the foot's ankle key at its top |
| head base, auricles, nose and lips, openings | (gap: Head not written) | Head | the head base shares the trunk's neck ring at its bottom |

The gaps are requests below. No rule here names the head base: where a consumer needs it, it takes the child of the trunk's top continuation event, which `merge` derives from the head base's `ends.bottom`.

### Frames, anchors and joints

Each module is placed by the bind skeleton of `body-observations.json`: 342 joints, each with its bind affine, among them `pelvis`, `spine_01` to `spine_05`, `neck_01`, `neck_02`, `head`, `clavicle_<s>`, `upperarm_<s>`, `lowerarm_<s>`, `hand_<s>`, each digit's `_01` to `_03`, `thigh_<s>`, `calf_<s>`, `foot_<s>`, `ball_<s>` and each toe's `_01` and `_02`, and no jaw or eye joint (survey). The module data carry that placement, so that a later transform moves a module by its anchor and every consumer follows:

- Anchor: the shared method's (Module frames and handles): the bind frame of the joint where the module's axis begins, keys, pole and relief axes stored in it, `compose` placing them by it, so shared keys, events and jets are evaluated in one world frame exactly as now.
- Named axes and declared joints: the shared method's (along, front, lateral, built by each part from joint centres; each bind joint declared by one module with its point and station), stored in the anchor's coordinates. A bind frame's own axes follow each bone's convention, so the consumers read "up", "forward", "dorsal" and "palmar" only from the named axes, and they turn with the module.
- Openings, globes and the lip boundary belong to the head module and are stored in its anchor's coordinates (Head). Each names the chain whose anchor it hangs from: an opening by its `base` or a `chain`, an eye and the lip boundary by a `chain` (the vermilion already has one). `merge` places the eyes and openings by that chain's anchor, and `AutoMovieHuman.generate` places the lip boundary by it before the detail box and the construction draw (Requests).
- `compose` carries every chain's anchor, named axes and declared joints, placed in the world, onto its loft chain (Method's Files), and `AutoMovieHuman.generate` hands the composed chains to the skin, the appearance and the skeleton with the eyes and openings it hands them now.
- Consumers read declared joints and named axes, never stature fractions taken as heights and never world axes where a module's frame is meant. World axes stay only where the world is meant: gravity for hanging hair and the shoulder field, the capture cameras.

### Export

`exportModules.ts` (Integration runs and owns it; the edits Method's Files lists for it are made here, Requests):

1. Inputs: the part fits under their plans' file names (`trunk-base.json`, `trunk-reliefs.json` as `{reliefs, ...}`, `palm_<s>-base.json`, `<digit>_<s>-base.json`, `foot_<s>-base.json`, `<toe>_<s>-base.json`, their `-strip.json`, the Arm, Leg and Head outputs), the trunk fit read without the `regions` and `radius` it no longer writes (Trunk). A fit without its `distance` record stops the export.
2. Regions as now: head, trunk (with the four limb strips), arm (palms, arms, digits, digit strips of both sides), leg (feet, legs, toes, toe strips). The trunk region declares `stature`, f1's `body.controls.height.value` imported from `packages/playground/src/human-parameters/f1.ts`. The head region carries `apertures` and `eyes` as the Head plan places them; the eye region `AutoMovieHumanEyeCalibration` stays a region of its own until then.
3. `samples` from the render, replacing the fitters' `2N`: with `tau` the chord tolerance the generator already bisects stations to (`AutoMovieHumanBodySurface`'s `TOLERANCE`, exported for this), a uniform phase step `dt` puts a chord of length about `|r_t| dt` on a section of curvature `kappa`, whose sagitta is `kappa |r_t|^2 dt^2 / 8` to second order. `samples = ceil(2 pi / dt_min)` with `dt_min = min sqrt(8 tau |r_t| / |r_t x r_tt|)` over the composed chain's rings (the merge of item 4), reliefs included, at the stations `AutoMovieHumanLoftStations.bisect` gives at `tau` and at 4 Gauss-Legendre phases per section span, `r_t` and `r_tt` from `AutoMovieHumanLoftJet.at`. One chordal tolerance then governs both directions of the tessellation, the standard criterion for tessellating a parametric surface; no count is a fitted quantity. The chordal count resolves the surface, not what is drawn on it per vertex or cut from it: the generator already refines stations to `AutoMovieHumanBodyApertures`' 0.5 mm `SPACING` where rings pass within 2 mm of an opening or through a detail box (the lips' colour boundary), and the same refinement is added in phase (Replacement step 6), so an opening's cut and the lip boundary are not drawn on cells sized for the surface alone. Per-vertex appearance fields narrower than the tessellation elsewhere (the periorbital ring, 0.08 interpupillary distances wide) are sampled at the vertices the rule gives, and the inspection round judges them.
4. Before writing, the exporter merges the regions it built with `AutoMovieHumanBodyRegions.merge` (Method's composed merge) and evaluates every chain's jets at its keys; any refusal (a shared key of another control count, a missing owner, a cap behind its plane) stops the export, so the generator never meets a module it cannot evaluate.
5. Each chain's anchor, named axes and declared joints are written as the part's fit gives them. Its keys, pole and relief axes are written in the anchor's coordinates: a fit that gives them in the world (the Hand's and the Foot's) is converted by the anchor's rigid map (`HumanModuleAnchor.ts`, Method), a fit that gives them in the anchor's coordinates already (the Trunk's) is copied, each fit's record saying which; then rounded as above. Trims and relief windows are already in their base's chart.
6. Each region's comment names its fitters and files: the trunk's `fitTrunkBase.ts`, `fitTrunkReliefs.ts` and `fitStrip.ts`; the arm's `fitHand.ts`, the Arm's fitter and `fitStrip.ts`; the leg's `fitFoot.ts`, the Leg's fitter and `fitStrip.ts`; the head's the Head's fitters. The printed sizes are recorded with the export command.

### Replacement and deletions

In one change of step 3, in this order, so that each step compiles against the previous and the package compiles at the end:

1. Method's `weights` and composed `merge` land (Retirement step 1).
2. `exportModules.ts` writes `AutoMovieHumanHeadModules.ts`, `AutoMovieHumanTrunkModules.ts`, `AutoMovieHumanArmModules.ts` and `AutoMovieHumanLegModules.ts` under `generation/calibration/`.
3. `AutoMovieHumanBodyCalibration.ts` becomes `AutoMovieHumanBodyRegions.merge([head, trunk, arm, leg modules, AutoMovieHumanEyeCalibration])` with no repair rule; the constant keeps its name, so `AutoMovieHumanBodyLaw`, the skeleton and the curve diagram keep their imports.
4. `AutoMovieHumanBodyLaw.calibrate` returns `{body: AutoMovieHumanBodyCalibration, vermilion: AutoMovieHumanVermilionCalibration}` for every input; `displace`, `section`, `lips`, `move` and the basis, warp and event-join imports go. f2, m1 and m2 render as f1 scaled to their stature until #2998.
5. Delete: `calibration/AutoMovieHumanTorsoCalibration.ts`, `AutoMovieHumanFootCalibration.ts`, `AutoMovieHumanBodyMorphCalibration.ts`; `AutoMovieHumanEarCalibration.ts` once the head region carries the nostril openings and pockets (Head); `IAutoMovieHumanBodyMorph.ts`, `AutoMovieHumanBodyWarpField.ts`, `AutoMovieHumanBodyWarp.ts`, `AutoMovieHumanBodyGirth.ts`, `AutoMovieHumanBodyLandmarks.ts`; `AutoMovieHumanBodyTree.ts` and `AutoMovieHumanStretchProfile.ts`, which only the warp field imports; `AutoMovieHumanSectionLoops.ts`, `AutoMovieHumanContactSmoothing.ts`, `AutoMovieHumanLipSmoothing.ts`, `AutoMovieHumanCornerSmoothing.ts`, `AutoMovieHumanStationContinuity.ts`, `AutoMovieHumanEventJoin.ts`. `fitBodyMorph.ts` goes once Method's `emitSpecimenCalibration.ts` holds its specimen branch (Files). `calibration/AutoMovieHumanBodySpecimenCalibration.ts` and `IAutoMovieHumanBodySpecimen.ts` stay, imported by nothing until #2998's law (Retirement); `AutoMovieHumanMonotoneCubic.ts` stays for the scalp boundary.
6. `AutoMovieHumanBodySurface.ts`:
   - delete `ringBlend` with `BLEND`, `PASSES`, `FOLD`;
   - in `surfaceNormals`, keep the jet normal oriented with the mesh normal and drop the `AGREE` test; a chain without jets is refused (every chain is composed), and `stationJet`, `place`, `STEP`, `AGREE` go; a vertex without loft coordinates or with a singular jet keeps the mesh normal, the mesh being the surface there;
   - delete `domeBase`, `DOME`, `FLOOR`, `ASPECT` and the dome in `pole`: a cap closes by its fan to `target.pole`, and a chain end with no event, root or cap is refused instead of closing at a provisional axis point; the context's calibration-pole map goes with it;
   - `ownPhases` adds the phase refinement of Export 3: where a chain's rings pass within `REACH` of an opening's outline or through a detail box, the phase interval they occupy there takes uniform phases `SPACING` mm of arc apart, as `AutoMovieHumanBodyApertures.refine` and `detail` already do in station;
   - name a strip's group `<appendage>/<k>` with `k = -1` for a bottom-rooted appendage and `k = K - 1` for a top-rooted one of `K` keys: the interval beyond the rooted key. The section `<appendage>/0` (or `/K-1`) then shapes the strip by the existing Hermite-endpoint rule of `resolveHumanCurves`, and every consumer that reads the suffix as a band number sorts the strip next to the rooted end;
   - a continuation event's child whose end key equals the parent's end layer exactly (the shared key, copied by `compose`) takes the parent's ring phases as its inherited phases: the two sections are one control polygon, so a phase names the same point on both, and the 1024-sample scan and its monotone floor serve only other inherited rings.
7. `AutoMovieHumanBodyStrip.ts`: `across` and `station` refuse a chain without jets (the 0.05 mm differences and `H` go); the interior rows' ring tangent takes the central difference at `eps^(1/3)` rad, the optimal step of the plan's Constants (Press et al. 2007, sec. 5.7), instead of 1e-4.
8. `AutoMovieHumanBodyRoots.ts`: `normal` is the jet normal, oriented away from the axis as now; `trim` solves each outline point by the shared foot rule's projection along `forward` (two equations `S(s, t) . lateral`, `S(s, t) . up` against the point, Jacobian from the exact jet), starting from the nearest of the surface sampled at its keys and the midpoints between them in station and in phase among samples whose normal faces `forward`, then from the previous point's solution; it stops when a step is no shorter than the one before, at most 7 iterations, and refuses a point that does not converge or leaves the chain. The ±8 mm, 512-phase search, the 1e-3 bias, the 30 steps, the 0.01 mm and 1e-4 rad differences and the 1 mm step bound go.
9. `AutoMovieHumanBodyConstruction.ts` draws, with the chain functions the skin uses: each relief's window edge on the skin as `<chain>/relief.<name>`; each appendage's root loop on its base as `<appendage>/trim`; each based opening's trim loop as `<base>/trim.<opening>`. The nonnumeric suffixes shape every interval of their chain by `resolveHumanCurves`' rule, so a strip, a relief or a trim is selectable, isolable and framable. They are 3D curves only; the 2D diagram keeps its grammar of sections, stations and axes.

`AutoMovieHumanBodyApertures.cut` (clipping by position and its 64-triangle island rule) stays for openings without `base`, with `refine` around them; an opening the Head plan gives a `base` takes the trim path above instead.

### Re-pointing the consumers

| Consumer | Change |
| --- | --- |
| `AutoMovieHumanJointCentres` | Joint centres are the declared bind joints mapped through their modules' anchors: the humanoid bone whose origin a bind joint is takes it (`hips` `pelvis`, `neck` `neck_01`, `atlas` `neck_02`, `head` `head`, `<s>Shoulder` `clavicle_<s>`, `<s>UpperArm` and `<s>Scapula` `upperarm_<s>`, `<s>LowerArm` `lowerarm_<s>`, `<s>Hand` `hand_<s>`, the thumb and finger bones `_01`, `_02`, `_03`, `<s>UpperLeg` `thigh_<s>`, `<s>LowerLeg` `calf_<s>`, `<s>Foot` `foot_<s>`, the toe bones `_01` and `_02`), a fixed vocabulary of the rig like `AutoMovieHumanPoseChannels`' table, not a person's values. Digit and toe tips are the chains' cap poles; the eyes the globes. Where the rig has no joint the existing conventions stay, placed between declared joints and in their modules' frames instead of stature units along world axes: `spine` and `chest` at the omphalion and xiphion fractions (0.245, 0.617, de Leva, `docs/anatomy/joint-range.md:77`) of the trunk axis's arc from `pelvis` to `neck_01` (the Trunk's spline through the spine joints); the lesser toes' third joint by the `FINGER` units along `_02` to the tip; the subtalar and midfoot points by the existing `lerp` between `foot_<s>` and the ball; the jaw's temporomandibular point and chin by its convention (`:81`) on the head frame's axes. A segment's radius is its module chain's girth at the station midway between the feet of the segment's two joints on that chain's axis, clamped to the chain's ends (a declared joint need not carry a station, Foot, so the foot of its point is taken). No `stationAtHeight`, stature fraction taken as a height, `ear.lobe` occiput or `calibration.poles` remains |
| `AutoMovieHumanGarmentBody` | reads `trunk` and `leg.<side>`; drops `upper` (the bust columns read `trunk` alone); measures in the trunk's own frame instead of world y, x and z: a vertex's height bin is its trunk station (its foot on the trunk chain's axis), its extents are taken on the trunk frame's forward and lateral axes carried to that station, the trunk chain and frame passed through `IAutoMovieHumanAppearanceBody`; the axilla is the lowest vertex in trunk station an `arm.<side>` part shares by position with a `trunk` part, the strip's seam on the trunk's hole, read under a measure-only chain kind no garment pattern covers; the crotch stays the trunk's cap pole |
| `AutoMovieHumanSkinChart` | `upper` leaves `chartOf`; the head and trunk charts turn about their module chain's own axis (`chainAxis`) instead of world vertical (`verticalAxis` goes); the strip's numeric suffix (above) removes the `NaN` band sort |
| `AutoMovieHumanSkinLandmarks`, `AutoMovieHumanNail` | no name change for the Hand and Foot chains; first and last bands are numeric with the strip naming; the wrist, elbow and knee are the declared `hand_<s>`, `lowerarm_<s>` and `calf_<s>` joints instead of band extremes, 0.55 of the arm and 0.285 S; the palmar direction is minus the palm's front axis, not a cross product of chain centroids; the sole is the foot skin facing against the foot's front (dorsal) axis and lying on the plantar side of `foot_<s>` along it, instead of world down and the foot's lowest tenth in y; a toe nail faces its toe's front axis instead of world up; the ears take the Head's auricle names (gap) |
| `AutoMovieHumanSkinTone` | `forefoot.` leaves the foot test; the knee band is taken about the leg's declared `calf_<s>` along the leg's along axis, and the elbow's posterior side against the arm's front axis about `lowerarm_<s>`, not about 0.285 S in world y and against world +X |
| `AutoMovieHumanSkinMarks` | the `upper` branches go; the trunk's split is the axilla's trunk station (the garment's seam rule), not 0.7 S in world y, so the trunk above it keeps `upper`'s weights; the face test reads the head frame's forward axis, not world +X |
| `AutoMovieHumanFaceTone` | the profile, cheeks, nose tip and periorbital ring are measured on the head frame's along, forward and lateral axes about the eye globes instead of world y, x and z; head chains by the `head.` prefix (Head) |
| `AutoMovieHumanHeadField` (with the brow projector and hair) | the chart's centre and its azimuth-elevation grid are built on the head frame's axes instead of the world's; strands keep falling along world gravity; head and ear parts by the Head's names (Requests) |
| `HumanCaptureCamera` | the `head-*` close-ups read the Head's names; cameras stay in the world |
| `AutoMovieHumanVermilionCalibration` | its `chain` names the head chain the boundary lies on and its spans are stored in that chain's anchor coordinates as the Head gives them; `AutoMovieHuman.generate` places them by the chain's placed anchor (Frames, anchors and joints), so the construction id `<chain>/mouth_vermilion` addresses a chain that exists and the lips move with the head |
| `drawHumanCurveDiagram` | no name change (above, viewer) |

### Viewer and capture path

- `HumanViewerModel.pick` returns the curve ids a click toggles: a curve hit gives that curve as today; in `overlay`, when the ray's first hit is a skin part `human.skin.<chain>/<k>` and no curve lies within the existing pixel rings in front of it, it gives `<chain>/<k>`, `<chain>/<k+1>` and `<chain>/axis` (for a strip, its rooted section and `<chain>/trim`), as `verification.md`'s trace step reads. The layout's `pick` handler takes the list: it removes the ids when all are selected and adds the missing ones otherwise.
- `drawHumanCurveDiagram`: a section is the skin's ring at the station in its frame (`AutoMovieHumanLoftChain.ring`, reliefs included, through `local`), its curvature from the exact `r_t` and `r_tt` of `AutoMovieHumanLoftJet.at` projected on the frame's axes; the 1e-4 rad difference goes.
- `createHumanPartStyle`: `material=clay` dresses `human.cavity.` parts as well.
- `HumanImageSourceIdentity.source` refuses a `.js`, `.mjs`, `.cjs`, `.d.ts` or `.js.map` file inside the hashed trees (none exists today), so an emitted file can no longer change what Vite serves under an unchanged key.

### Render audit after step 3

1. `node_modules/.bin/ttsc --noEmit -p packages/human/tsconfig.json` and `-p packages/playground/tsconfig.json`, never `--emit`; any error stops the audit.
2. A read-only script `.shots/claude-scratch/integration/generateAll.ts` generates f1, f2, m1 and m2 and their stickman skeletons in Node and prints per person the part, vertex and triangle counts, any non-finite position or normal, and the bounds; all four must generate.
3. The viewer from the repository root as `screenshot.md` gives it, the image registry set. The service on port 5173 has run since 2026-10-24 and is not Integration's; the step 3 change edits `HumanImageSourceIdentity.ts`, which its host identity hashes (`HumanImageSourceIdentity.ts:27`-`:40`), so that service answers every image request with 503 "operator restart required" (`createHumanImagePlugin.ts:439`-`:451`) until restarted. The audit therefore runs on a second viewer Integration starts on current source with the same command on a free port with `--strictPort`; 5173 is left alone, and both stay up afterwards, since the Human skill leaves stopping a live server to the user. The audit set of `verification.md`: f1 `whole-front`, `whole-left`, `free` with `view=%2By`, `whole-back`, `surface` with `garment=0`, and `construction` `whole-front`, `whole-left`, `whole-back`; each with a unique `fresh` nonce, accepted only with `x-human-cache: new-requested-frame`.
4. Each PNG's exact bytes and headers saved under `packages/playground/.shots/<round>/` (`curl -D`), its SHA-256 checked against `x-human-png-sha256` and listed with `x-human-captured-utc`; every PNG opened.
5. A failed capture stops modeling; the viewer and capture path are repaired first.

The inspection round of step 4 then runs over all four people as `verification.md` sets it.

### Documents

- `docs/techniques/section-chain-lofting.md`: rewritten to the module construction: key sections composed with their jets, shared keys as continuation events, caps, reliefs, appendages with strips and trims, the addresses (`<chain>/<k>`, the strip's `/-1` or `/K-1`, `/relief.<name>`, `/trim`), `samples` by the chordal tolerance, and no parameter law until #2998; the shape basis and the measurement law leave it.
- The fitters' `README.md`: the `fitBodyMorph.ts` row becomes `emitSpecimenCalibration.ts` and its output `AutoMovieHumanBodySpecimenCalibration.ts`.
- `docs/anatomy/joint-range.md`: the stickman paragraph (`:72`, which also cites `skeleton.md` for the fractions) and the joint rows (`:76`-`:91`) state the declared bind joints and the conventions that remain between them (Re-pointing); the `0.518 S`, `0.3425 S`, `0.2865 S` and `0.0405 S` placements leave it.
- JSDoc of the files this section edits, to the current facts: `AutoMovieHuman.ts` (sources and part ids), `AutoMovieHumanBodyLaw.ts`, `AutoMovieHumanBodyCalibration.ts`, `IAutoMovieHumanBodyRegion.ts`, `AutoMovieHumanBodySurface.ts`, `AutoMovieHumanGarmentBody.ts`, `IAutoMovieHumanAppearanceBody.ts`, `IAutoMovieHumanHermiteCurve.ts` and the appearance files below; `AutoMovieHumanJointCentres.ts`'s module comment, which cites `docs/anatomy/skeleton.md` for stature fractions that note does not hold (`:11`-`:13`), cites the bind skeleton and `joint-range.md` instead.
- The survey's "Couplings" (adding `AutoMovieHumanNail`, which the Hand and Foot found missing), "Everything that depends on it" and "Exporter and the generator gap" after the render, as facts change.

### Files

- `packages/human/src/generation/`: `AutoMovieHumanBodyCalibration.ts`, `AutoMovieHumanBodyLaw.ts`, `AutoMovieHumanBodySurface.ts` with `IAutoMovieHumanSurfaceContext.ts` (the pole map) and `IAutoMovieHumanSurfaceBoundary.ts` (an inherited boundary's phases), `AutoMovieHumanBodyApertures.ts` (the phase refinement beside `refine` and `detail`), `AutoMovieHumanBodyStrip.ts`, `AutoMovieHumanBodyRoots.ts`, `AutoMovieHumanBodyConstruction.ts`, `calibration/AutoMovieHumanVermilionCalibration.ts` (its `chain`, and its spans in that chain's anchor coordinates as the Head gives them) with `lofting/IAutoMovieHumanHermiteCurve.ts` (its JSDoc, "in the registered millimetre frame", then names the chain's anchor coordinates), the four new module files, the deletions above.
- `packages/human/src/AutoMovieHuman.ts` (the composed chains' anchors, axes and joints handed on; the lip boundary placed by its chain's anchor); `packages/human/src/skeleton/AutoMovieHumanJointCentres.ts`; `packages/human/src/appearance/`: `AutoMovieHumanAppearance.ts`, `IAutoMovieHumanAppearanceBody.ts`, `AutoMovieHumanSkin.ts`, `AutoMovieHumanGarmentBody.ts`, `AutoMovieHumanSkinChart.ts`, `AutoMovieHumanSkinLandmarks.ts`, `AutoMovieHumanSkinTone.ts`, `AutoMovieHumanSkinMarks.ts`, `AutoMovieHumanFaceTone.ts`, `AutoMovieHumanNail.ts`, `AutoMovieHumanHeadField.ts`, and the Head-named patterns if the Head's names require them.
- `packages/human/docs/anatomy/joint-range.md`, `packages/human/docs/techniques/section-chain-lofting.md`.
- `packages/playground/src/human/`: `HumanViewerModel.ts`, `mountHumanViewerPage.ts`, `layoutHumanViewerPage.ts` (the pick's selection), `drawHumanCurveDiagram.ts`, `createHumanPartStyle.ts`; `packages/playground/src/human-images/HumanImageSourceIdentity.ts`.
- `test/src/executable/reference-experiments/human-calibration/exportModules.ts`.

### Constants

| Constant | Value | Source |
| --- | --- | --- |
| tessellation chord tolerance `tau` | the generator's existing station `TOLERANCE` | one renderer tolerance for both directions; not a fitted quantity (Module data format) |
| chord sagitta | `kappa L^2 / 8` | second-order expansion of a circular arc's sagitta |
| phase refinement near openings and detail boxes | the generator's existing `SPACING` (0.5 mm) within `REACH` (2 mm) | the station refinement's own constants, now used in both directions; render tessellation, not a fitted quantity |
| strip ring-tangent step | `eps^(1/3)` rad | Press et al. 2007, sec. 5.7, as the plan's Constants |
| trim Newton iterations | 7, stop when a step does not shorten | the plan's foot rule |
| joint centres | the declared bind joints | the source's rig (`body-observations.json`) |
| conventions between joints | omphalion 0.245 and xiphion 0.617 of the trunk axis's `pelvis` to `neck_01` arc; the jaw's points; `FINGER` units; the foot's `lerp` | de Leva and conventions, `docs/anatomy/joint-range.md:77`, `:81`, `:90`; now in module frames, not stature units along world axes |

### Defects removed by cause

| Survey fact (Integration) | Removed by |
| --- | --- |
| consumers take a station for a height, a fixed limb orientation and tips from `calibration.poles` | declared joints, `appendages` and shared ends for orientation, cap poles |
| joint centres and appearance fields anchored at stature fractions taken as world heights and at world axes | anchors, named axes and declared joints (Frames, anchors and joints); each consumer measures on its module's named axes and from its declared joints |
| `upper`, `head`, `head.middle`, `head.upper`, `hand.<s>.1`, `forefoot.`, `ear.lobe.<s>` name no module | re-pointing table; the head base by the trunk's continuation event; the auricles by the Head's names (gap) |
| strips named `/root` give `NaN` bands | the strip's numeric interval index |
| `ringBlend` would act at every shared key; the 30-degree fallback, the domes | deleted (Retirement step 3); every chain carries jets |
| inherited phases by a 1024-sample scan at shared keys | the owner's phases at a shared key |
| strip, root and trim derivatives by differences and an iteration cap | exact jets; the foot rule's Newton for trims; `eps^(1/3)` for the ring tangent |
| no construction curve for reliefs, strips, trims | window, root-loop and trim curves |
| the exporter writes no stature, no openings, no distance check, no anchor and never evaluates its output | Export 1 to 5 |
| `samples` copied as the fitters' `2N` | the chordal rule |
| pick returns no skin interval; the diagram omits reliefs and differentiates numerically; clay skips cavities; emitted `.js` invisible to the key | Viewer and capture path |
| 4,968,079 bytes of literals compiled three times in a 30 min 42 s package build | the deletions; the step 3 commit's CI run records the new build time |

### Requests

- Method, Module data format and Generator evaluation (the anchor with its named axes and declared joints, `compose` carrying them onto the loft chains, and the exact copy of a shared end are already there): an eye and an opening without `base` stored in the head anchor's coordinates (Module data format) need a `chain` naming the chain whose anchor they hang from, in `IAutoMovieHumanBodyCalibration.IEye` and `IAutoMovieHumanLoftAperture`, and `merge` places them by that chain's anchor; `IAutoMovieHumanHermiteCurve`'s `chain` serves the lip boundary as it is.
- Head: chain names under `head`, `head.*` and `ear.*.<side>` (or name the patterns to change); which openings get a `base`; the nostril openings and pockets in the head region (Retirement); the chain the lip boundary lies on; the openings, globes and lip boundary in the head anchor's coordinates, each naming its chain; the head modules' named axes (along, forward, lateral of the head, from its joints and the eye globes); the joints the head base declares, `neck_02` (beyond the Trunk's neck ring, Trunk) and `head`.
- Arm and Leg: chains `arm.<side>` and `leg.<side>` rooted on `trunk` by an `appendages` entry at their first key and sharing the palm's or foot's key at their top, as `exportModules.ts` and the joint centres read them; their named axes, the front axis forward at rest, which the elbow's posterior side reads; their declared joints, `upperarm_<s>` and `lowerarm_<s>`, `thigh_<s>` and `calf_<s>` (the Trunk reads `thigh_<s>` without declaring it, Trunk).

## Self-review

### Shared method and Retirement, round 1

22:51:55 to 23:01:28 +09:00, 2026-10-27. Read whole: this plan; `HumanModuleFitting.ts`, `HumanReliefFitting.ts`, `fitStrip.ts`, `fitAppendage.ts`, `fitBodyBase.ts`, `fitTrunkBase.ts`, `fitHeadBase.ts`, `fitTrunkReliefs.ts`, `fitHeadReliefs.ts`, `exportModules.ts`, `planBodySections.ts`, `analyseBase.ts`, `fitAuricleSet.ts`, `runAuricleSet.ts`, `fitFeatureChain.ts`, `emitHeadRegion.ts`, `emitEarCalibration.ts`, `emitFootCalibration.ts`, `HumanSectionCorrespondence.ts`, `HumanEventReconciliation.ts`, `FootCorrespondence.ts`, `EarSectionGeometry.ts`, `fitBodyMorph.ts`. Search: local imports of the directory (`grep "^import.*from \"\./"`). Findings, all fixed in one change:

1. The nostril apertures and pockets live only in `AutoMovieHumanEarCalibration` (`emitHeadRegion.ts` carried them over); deleting it would drop them. Retirement now deletes it only once the head region carries them.
2. `fitAuricleSet.ts` also plans the `rim-normal-v1.json` observation; deleting it with the experiments loses that plan. The auricle files now stay for the Head plan.
3. The plan dropped the biweight without saying so or why. Observations and weights now state it.
4. `fitAppendage.ts` copies the palm's or foot's key into the limb and `compose` refuses a shared key of another control count, so a per-module N rule could break every shared key. Keys and control counts now give a sharer its owner's N.
5. `planBodySections.ts` writes planes, not a plane function, so evenly spaced key stations had no plane. Keys now move to the nearest family plane.
6. `AutoMovieHumanBodySpecimenCalibration` holds f1's inputs, not world-height chains, and #2998's law needs them. Retirement now keeps it.
7. The part fitters map landmarks and root loops with `sampling` and `project`, which the rewrite removes. Files now gives them the foot rule.

Correction recorded in round 2: round 1 read the code files concatenated into one listing whose lines were cut at 140 characters, so long lines were not read whole. Round 2 reread every file at full width.

### Shared method and Retirement, round 2

23:01:28 to 23:17:08 +09:00, 2026-10-27. Read whole, at full width: this plan; `HumanModuleFitting.ts`, `HumanReliefFitting.ts`, `fitStrip.ts`, `fitAppendage.ts`, `fitBodyBase.ts`, `fitTrunkBase.ts`, `fitHeadBase.ts`, `fitTrunkReliefs.ts`, `fitHeadReliefs.ts`, `exportModules.ts`, `planBodySections.ts`, `analyseBase.ts`, `emitHeadRegion.ts`, `emitEarCalibration.ts`, `emitFootCalibration.ts`, `HumanImplicitFitting.ts`, `fitFeatureChain.ts`, `HumanSectionCorrespondence.ts`, `HumanEventReconciliation.ts`, `FootCorrespondence.ts`, `EarSectionGeometry.ts`, `fitAuricleSet.ts`, `runAuricleSet.ts`, `fitBodyMorph.ts`; `IAutoMovieHumanFeatureChain.ts:15`-`:40`; `IAutoMovieHumanBodyRegion.ts` field list. Searches: `1e-12|1e-300|1e-30` and `4.685|1.4826|asymmetry|tukey` over the fitters; `fitBodyMorph` over `packages/human` and `test/src`; `samples` over the fitters. Findings, all fixed in one change:

1. Caps named neither the own-skin partition for `cap.from` nor the sign for a bottom cap, and the key spacing was unnamed. Caps now state the partition, `sigma` and `D`.
2. The Gauss rule's exactness and the section spacing were stated loosely. Observations and weights now give degree 7 and the trapezoid spacing over foot-ordered sections.
3. A foot that failed in a later projection could leave or rejoin the kept set, so the objective could rise. Iteration now freezes the kept set per loop.
4. A trim's residual in chart units mixed radians and millimetres. Solve now measures it through the parent's first fundamental form.
5. The reach bracket had no stated start. It now starts from 1 and the golden ratio; Constants carries it and the `weights` check.
6. Files said `HumanImplicitFitting.ts` calls `sampling` and `project`; only the two auricle scripts do. Files now says so and lists the auricle scripts' own constants for the Head plan.
7. Cholesky pivots are floored at 1e-12 and divisors at 1e-12, 1e-300 or 1e-30 (`HumanReliefFitting.ts:417`, `fitStrip.ts:716` and others), a clamp the plan did not remove. Solve now stops on a non-positive pivot; the survey table carries the row.
8. The survey table had no row for the biweight and asymmetric least squares, though the plan drops them. The survey now carries it.
9. The relief axis alternation could cycle between active sets without a rule for which fit to keep. It now keeps the cycle's lowest objective.
10. The head region may carry `apertures` and `eyes`, which the exporter's field lists do not write. Module data format and Files now write them.
11. `samples: 2 * N` in three fitters is a rendering choice the plan did not place. Module data format leaves it to Integration's render; the survey table carries the row.
12. `fitBodyMorph.ts` also emits the kept `AutoMovieHumanBodySpecimenCalibration.ts`, so deleting it loses that emitter. Files moves the branch to `emitSpecimenCalibration.ts`.
13. Retirement left `docs/techniques/section-chain-lofting.md` and the fitters' README describing the deleted basis. Step 4 now updates them.
14. The head families' sections run into the mouth and nostrils, and no owner was named for removing them. Observations and weights now gives it to the Head partition.

### Shared method and Retirement, round 3

23:17:32 to 23:18:35 +09:00, 2026-10-27. Read whole: this plan; the survey's "Shared fitting code" table. Search: `samples` in `fitTrunkBase.ts` and `fitStrip.ts`. Findings, all fixed in one change:

1. Iteration claimed each projection cannot raise the objective, but a Newton projection may end at a farther local foot. A projection that ends no nearer now leaves the foot.
2. The mapping table gave every survey table row to the shared method, though three rows stay outside it. The table now names them.
3. The biweight citation ended at `:984`; the weight is used through `:985`. Both documents now cite `:977`-`:985`.
4. Round 2's `samples` finding named three fitters; `fitTrunkBase.ts:202` is a fourth. The survey row now lists all four.

Correction recorded in round 4: round 3 read the survey table only as its lines 150 to 160 cut at 400 characters, not whole. Round 4 read it whole.

### Shared method and Retirement, round 4

23:18:55 to 23:23:10 +09:00, 2026-10-27. Read whole: `survey.md`. Searches: chains (`"basis":"spline"`), poles and trims in the four region literals under `generation/calibration/`; `AutoMovieHumanBodyRegions.ts:40`-`:90`. Findings, all fixed in one change:

1. The survey gave the head region 8 chains; its literal holds 11 (`head.lower`, `head.middle`, `head.upper` and four chains per auricle), which with the torso's 23 and the foot's 17 make the 51 merged chains (trims cut chains, never remove them). The survey now says 11.
2. The exporter gap list named "landmarks" twice for two different modules. It now names body and skin landmarks.

### Shared method and Retirement, round 5

23:23:22 to 23:23:55 +09:00, 2026-10-27. Read: this plan from "Iteration" to the end, and line 51 (the only line above it changed since round 3); `survey.md` lines 29 and 218 (round 4's changes). Findings: none.

Correction recorded in round 6: round 5 was not a full round. It read part of the plan and none of the fitter files, so it cannot close the review.

### Shared method and Retirement, round 6

The main agent's review, received after 23:23:55; the fixes were made from 23:33:24 (`sectionResolution.ts` created) to 23:44:15 +09:00, 2026-10-27. Read: Montoya, Ulloa and Miller 2014, pages 96 to 99 (the knot selection methods), fetched as PDF; web searches for Ruppert 2002's algorithms. Ruppert 2002's own text could not be fetched. Commands:

- `node --max-old-space-size=4096 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/method/sectionResolution.ts test/.shots/f1 .shots/claude-scratch/method/section-resolution.txt`, output `.shots/claude-scratch/method/section-resolution.txt`;
- `node --max-old-space-size=4096 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/method/summarizeResolution.ts .shots/claude-scratch/method/section-resolution.txt .shots/claude-scratch/method/section-resolution-summary.txt`, output `.shots/claude-scratch/method/section-resolution-summary.txt`;
- `awk '$1=="head-horizontal" && $3>=1586.83 && $3<=1616.8 {printf "%s/%s/%s/%s  ", $3, $6, $7, $8} END{print ""}' section-resolution.txt`, which printed the eye-socket rows' stations, distances and azimuths to the terminal;
- `awk '$1=="trunk" && ($7>=157.5 || $7<=-157.5) {b=int($3/100)*100; n[b]++; if($6>m[b]) m[b]=$6; s[b]+=$6} END{for (k in n) print k, n[k], s[k]/n[k], m[k]}' section-resolution.txt`, which printed the back-midline rows per 100 mm band to the terminal;
- `awk '$1=="trunk" && $3<900 {printf "%s/%s/%s/%s/%s  ", $3, $4, $6, $7, $8} END{print ""}' section-resolution.txt`, which printed the lowest trunk rows to the terminal.

The two `awk` commands ran in `.shots/claude-scratch/method/`.

Findings, all fixed in one change:

1. The control counts applied the cap of Ruppert, Wand and Carroll's default without the sufficiency check that Ruppert 2002 requires. Keys and control counts now select every count by Ruppert 2002's myopic algorithm under the section-blocked cross-validation score, coordinate by coordinate. The default only holds the other direction in the first pass. The survey table now names the search.
2. The plan did not say what N = 35 can represent. Keys and control counts now carry the measured table as evidence, not as a rule. The 0.2 mm criterion of `sectionResolution.ts` measures only resolution; the plan states that no count is raised to meet an error target.
3. The lowest trunk rows, 807.1 to 899.1 mm, have perimeters from 1209.6 to 987.0 mm. Whether they hold both thighs is now named as the Trunk and Leg partition's question.

### Shared method and Retirement, round 7

23:44:47 to 23:50:12 +09:00, 2026-10-27. Begun as a full round. It read this plan's lines 1 to 139 when the owner's order arrived, relayed by the main agent, so it is not a full round. Read: those lines; the order; `survey.md` lines 154, 161 and 181. Findings, all fixed in one change with the order:

1. The order forbids any rule that raises a count or tightens a fit because rows are missed, and any use of the 0.2 mm tolerance as a target. Three rules used it: the foot acceptance and the iteration stop read `tau`, and the constants table carried it. The foot is now accepted by Piegl and Tiller's zero-cosine test alone, and the loop stops when the objective's decrease reaches rounding. Shared method now states the order, and Surface distance says no rule reads the record.
2. The count search and the smoothing kept the lowest held-out score, which favours more parameters whenever the score dips by noise. Both now keep the simplest candidate within one standard error of the best (Breiman et al. 1984; Hastie, Tibshirani and Friedman 2009). The count search's stop compares the improvement with the score's standard error, replacing the 0.98 factor whose source was not read. Shared method gives the reasons for keeping held-out sections as the criterion. The survey's cross-validation, iteration and check rows say the same.
3. The coordinate search could cycle between pairs of counts without a rule. It now stops on a revisited pair.
4. Strip rows below the first candidate had no stated choice. They are now all evaluated under the one-standard-error rule.
5. The evidence table said "each observed loop's largest-perimeter loop", named the eye-socket rows by landmark heights the family does not reach, and gave no bounds for "back-lateral". It now says "section", gives the observed stations 1587.0 to 1614.0 mm and the octants within 22.5 degrees of ±135 degrees.

### Shared method and Retirement, round 8

23:50:31 to 23:56:46 +09:00, 2026-10-27. A full round. Read whole:

- this plan;
- every fitter file it names: `HumanModuleFitting.ts`, `HumanReliefFitting.ts`, `fitStrip.ts`, `fitAppendage.ts`, `fitBodyBase.ts`, `fitTrunkBase.ts`, `fitHeadBase.ts`, `fitTrunkReliefs.ts`, `fitHeadReliefs.ts`, `exportModules.ts`, `planBodySections.ts`, `analyseBase.ts`, `fitFeatureChain.ts`, `emitHeadRegion.ts`, `HumanSectionCorrespondence.ts`, `HumanEventReconciliation.ts`, `FootCorrespondence.ts`, `EarSectionGeometry.ts`, `emitEarCalibration.ts`, `emitFootCalibration.ts`, `fitAuricleSet.ts`, `runAuricleSet.ts`, `HumanImplicitFitting.ts`, `fitBodyMorph.ts`, `README.md` and `SESSION-REJECTED.md`;
- `summarizeResolution.ts` lines 85 to 100.

Read in part: `AutoMovieHumanFeatureChain.ts:220`-`:228` and `IAutoMovieHumanBodyRegion.ts:53`-`:59`.

Findings, all fixed in one change:

1. The one-standard-error choice of the smoothing parameters had no bracket and no stated standard error. Smoothing parameters now bracket it by 1 and the range's end, keep the end when the score stays within the bound there, and take the minimum's fold standard error.
2. `HumanSmoothingSelection.ts` in Files did not hold the standard error or the choice. It now does.
3. The deletion list of `HumanModuleFitting.ts` left the `composed` switch, `Normal`, `Model`, `bspline`, `cellKey` and four interfaces unnamed. Files now names them, and what stays.
4. The cap rule silently replaced the palm's, foot's and trunk's landmark poles (`fitBodyBase.ts:211`-`:215`, `fitTrunkBase.ts:129`-`:130`). Caps now says so.
5. The auricle scripts carry rules against the order that the plan did not list: the count raised until within one chart cell (`fitAuricleSet.ts:71`-`:87`), region points kept by their residual (`runAuricleSet.ts:160`), smoothing to the rows' error (`:60`), and the divisor floor of `HumanImplicitFitting.ts:131`. Files now lists them.
6. Files replaced the README with one of the shared method's usage, which would drop the rows of the fitters that stay, while Retirement step 4 edits its `fitBodyMorph.ts` row. Files now keeps those rows.
7. The evidence row of the lowest trunk rows did not say where the present trunk fitter puts them. It now names its cap and masked leg regions (`fitTrunkBase.ts:128`-`:133`, `:406`).

### Shared method and Retirement, round 9

23:57:08 to 23:58:04 +09:00, 2026-10-27. A full round.

- Read whole: this plan; `HumanModuleFitting.ts` again.
- The tool refused to reread the other fitter files of round 8 because they were unchanged, so this round reviewed them from round 8's whole reads of 23:50 to 23:56. A listing of the directory's files written after 22:00 printed none, so nothing had changed in them.

Findings, all fixed in one change:

1. The auricle rules sat as a top-level list inside the Files list, breaking it, and called every rule a breach of the order. They are now a nested list in two groups: three rules that break the order, and the invented constants and floors.
2. The relief rewrite's deletion list left out the thin-plate energy, the cross-validation with Hutchinson's estimator, and the floored solvers. Files now names them.
3. The strip rewrite's deletion list left out the biweight, the two pairing rounds, the thin-plate energy, the cross-validation, and the floored solvers. Files now names them.

### Shared method and Retirement, round 10

23:58:22 to 23:58:43 +09:00, 2026-10-27. A full round.

- Read whole: this plan, lines 1 to 173 and 174 to 223 after round 9's change; the table and records after line 223 were unchanged since round 9 read them.
- The fitter files were reviewed against the plan from round 8's whole reads. The directory listing of files written after 22:00 again counted 0, and `HumanModuleFitting.ts` was read whole again in round 9.

Findings: none.

### Shared method and Retirement, round 11

The main agent's assignment of 2026-10-28 (owner orders 2 and 3, and the Requests of the Trunk, Hand, Foot and Integration sections), 2026-10-28. The changes were made before 01:29:25 +09:00, with no start time taken, and the review ran from 01:29:25 to 01:32:05 +09:00.

- Read whole: `owner-orders.md`, `common-rules.md`; this plan's Shared method, Retirement, Trunk, Hand (Frames, Requests), Foot (Module frames, Requests) and Integration ("Frames, anchors and joints", Requests); the survey's Trunk, Hand, Foot and Integration subsections.
- Read whole: `observeBodySections.ts`, `findRootKeys.ts`, `observeFootSections.ts`, `FootSectionGeometry.ts`, `measureIdentity.ts`, `HumanBodySkeleton.ts`.
- Read in part: `IAutoMovieRecoverySectionsInput.ts`, `IAutoMovieRecoverySections.ts:30`-`:80`, `IAutoMovieRecoveryTerminalSeed.ts`, `IAutoMovieRecoverySourceTerminal.ts`, `AutoMovieHumanFeatureChain.ts:195`-`:262`, `IAutoMovieHumanFeatureChain.ts`, `IAutoMovieHumanRelief.ts`, `planBodySections.ts:60`-`:90` and `:140`-`:150`, and one joint record of `body-observations.json`.
- The other fitter files the shared sections name were reviewed from round 8's whole reads. A listing of the directory's files written after 22:00 printed none.

Findings, all fixed in one change:

1. Order 2: modules were stored in world coordinates with no anchor. Module frames and handles now gives every module an anchor (its joint's bind frame), named axes and declared joints. Its stations, key frames, pole and relief axes are stored relative to the anchor, `compose` places them and copies a shared end layer exactly, and the module's handles are listed. Files adds the interface fields, `HumanModuleAnchor.ts` and the bind affine read.
2. The Hand and the Foot found the anchor of the shared text (a bind affine) and the frames of the parts and Integration (axes from joint centres) at odds. Both are now in the shared text: the bind frame places the module, and the named axes give the roles.
3. Caps: a farthest observed point lies in the end plane for parallel-plane modules and ties on the trunk's lowest row. Every pole is now the module's terminal, the first critical point past its end plane, as Recovery observes it. The Trunk's axis-and-Rise pole is rejected with its reason.
4. Observation families: the digits and toes were stopped by the origin test and the one-bone extension, and three digit roots held a neighbour's skin. The shared text now plans succession, continuation to the terminal, the `-v3` families, sibling roots in `-root-v3.json`, and terminals of end planes observed on their own.
5. Keys moved to observed planes. A key now lies in the module's plane function at an evenly spaced admissible station, admissible when its plane meets no end key's loop or its own start loop inside the skin. This answers the Foot's key rule and the Trunk's normal planes.
6. Representation took the planner's world-forward `u` and "horizontal for the trunk". The first key's `u` is now the module's front axis, carried by rotation-minimising transport.
7. Strips read the parent fit's `regions` and `radius`. They now read the part's `strips` record, report band widths and stop on a crossed band. A strip without observations keeps reach 1 and zero rows.
8. The partition, the start keys with gaps and the drop reason the Trunk asked for were missing. `HumanObservation.ts` and `HumanModuleKeys.ts` now carry them.
9. Files listed exporter changes as Method's. They now point to Integration's Export. `observeFootSections.ts` and `FootSectionGeometry.ts` join the deletions.
10. The text had layout faults: a misplaced paragraph, a sub-bullet holding unrelated text, `cap.from` defined by observed planes, and Retirement step 2 still citing world-height or observed-plane rules. They are fixed.

### Shared method and Retirement, round 12

01:33:42 to 01:34:06 +09:00, 2026-10-28. This is not a full round: it read only this plan's lines 120 to 199 (Caps to Foot points). Findings, all fixed in one change:

1. Caps' "past that loop" named a loop the new `cap.from` sentence no longer defines. It now reads "past its end key's plane".
2. Caps said a bottom cap's family is observed reversed, while Observation families observes the end plane on its own. It now says the end plane's normal is reversed.
3. The empty strip's objective was said not to depend on its unknowns, though the penalty depends on the rows. It now says the strip has no data term: the rows go to zero and the reach keeps the bracket's start.

### Shared method and Retirement, round 13

01:34:19 to 01:34:52 +09:00, 2026-10-28. A full round of the shared sections.

- Read whole: this plan's lines 1 to 378 (Goal to the head of Trunk base).
- The fitter files the shared sections name were reviewed from their whole reads this session (round 8, and round 11 for the observation tools). A listing of the directory's files written after 22:00 printed none, as in round 11.

Findings, fixed:

1. The resolution table still called the lowest trunk rows' perimeters an open partition question. The survey's Trunk subsection now finds that those rows hold both thighs' tops, and the Trunk partition gives the distal arcs to the Legs. The row now says so.

### Shared method and Retirement, round 14

01:34:56 to 01:36:14 +09:00, 2026-10-28. A full round of the shared sections.

- Read whole: this plan's lines 1 to 378.
- The fitter files the shared sections name were reviewed from their whole reads this session. A listing of the directory's files written after 22:00 counted 0.

Findings: none.

### Foot, round 1

00:07:34 to 00:09:10 +09:00, 2026-10-28. Read whole in the round: this plan; `exportModules.ts`. The other files the Foot section names (`fitBodyBase.ts`, `fitAppendage.ts`, `fitStrip.ts`, `findRootKeys.ts`, `planSitePlanes.ts`, `planBodySections.ts`, `observeBodySections.ts`, `observeFootSections.ts`, `FootSectionGeometry.ts`, `AutoMovieHumanFeatureChain.ts`) were reviewed from this session's whole reads before the round, so this is not a full round. Findings, all fixed in one change:

1. The pole was taken after the strip split, but the split is made on the start surface, which needs the pole: a cycle. The pole is now taken from the foot's observations before the split, and the order pole, start surface, trims, split is stated.
2. The toe run cited `FootSectionGeometry.overlaps`, a file the same section asks to delete. The run now states the test itself.
3. The toe strips claimed every trim lies on the cap region or just before it, which nothing measured; the trim region was undefined, and a trim round the cap's pole had no rule. The claim is gone; the region and the winding are stated.
4. The key-candidate rule departs from the shared key rule without asking Method to carry it. Requests now asks for it as the shared rule.
5. The toe numbers 2 to 4 were implied. Toes now names all five.
6. `exportModules.ts:171` names the Leg modules' fitters without `fitFoot.ts`. Requests now asks Method to add it.

### Foot, round 2

00:09:34 to 00:16:03 +09:00, 2026-10-28. Read whole: this plan's Foot section; the survey's Foot subsection; `fitBodyBase.ts`, `fitAppendage.ts`, `findRootKeys.ts`, `planSitePlanes.ts`, `planBodySections.ts`, `FootSectionGeometry.ts`, `fitStrip.ts`, `observeBodySections.ts` and `observeFootSections.ts`, through numbered listings of them (the tool refused to reread unchanged files directly). Not read in this round: the plan outside the Foot section, so this is not a full round. Search: the foot-range span counts in `foot-survey.txt` (awk). Findings, all fixed in one change:

1. Recovery's section API already follows a seeded loop to its distal maximum (`observeFootSections.ts:256`-`:268`), which gives the toe tip the pole needs; the observation request did not use it. It now does.
2. The partition did not say where a node goes whose foot on the start surface is dropped. It now stays with the foot base.
3. The survey called the plane spacing "every 4 mm" and "every 2 mm", but planes are counted from each joint (`planBodySections.ts:193`-`:196`). It now says so.
4. The survey gave left-side numbers as if both sides agreed: the foot range's least span count (17 / 15), the heads plane's straddle range (-14.5 / -14.4 to 11.6 / 11.7 mm) and the little toe's proximal range (-15.5 / -15.4 mm). It now gives both.
5. The survey placed the fan's convergence "in front of the ankle" and its spread "behind", which no measurement located. It now states only the measured closest approach.
6. The survey called the skin nearest the foot bone behind the ankle joint "the heel's", a different set from the heel's 110 vertices. It now names it by its rule.

### Foot, round 3

00:16:20 to 00:16:57 +09:00, 2026-10-28. A full round. Read whole: this plan. The fitter files the Foot section names were reviewed from round 2's whole reads of 00:09 to 00:16 and round 1's of `exportModules.ts`; a listing of the directory's files written after 22:00 printed none. Findings, all fixed in one change:

1. The toe precondition read as if it held the whole Foot fit back, though the foot base reads only the toes' root loops and proximal planes, which the requested families keep. Toes now says the foot base, and so the Leg, fit on the current files.

### Foot, round 4

00:17:14 to 00:18:05 +09:00, 2026-10-28. A full round. Read whole: this plan. The fitter files were reviewed from round 2's whole reads, unchanged since (round 3's listing). Read in part: `IAutoMovieRecoverySectionsInput.ts:25`-`:40` and `IAutoMovieRecoverySections.ts:50`-`:62`, after a search for `terminalSeeds` over `packages/recovery/src`. Findings, all fixed in one change:

1. The observation request cited the tip-following API through `observeFootSections.ts`, a file the same Requests ask to delete. It now cites the Recovery input and result types that define `terminalSeeds` and `terminals`.

Correction recorded in round 5: round 4 read this plan's lines 1 to 324, not the Self-review records after them, so it was not a full round.

### Foot, round 5

00:18:22 to 00:18:44 +09:00, 2026-10-28. A full round. Read whole: this plan, lines 1 to 486. The fitter files were reviewed from round 2's whole reads; a count of the directory's files written after 22:00 printed 0. Findings, all fixed in one change:

1. Round 4's record claimed a whole read of the plan; it read up to line 324. The correction above records it.
2. Toes' frame said the planes were "parallel to the plane normal to `_01`-`_02`", which names one plane, not the family. It now says the planes are normal to `_01`-`_02` and so parallel.

### Foot, round 6

00:18:59 to 00:19:50 +09:00, 2026-10-28. A full round. Read whole: this plan, lines 1 to 495. The fitter files were reviewed from round 2's whole reads; a count of the directory's files written after 22:00 printed 0. Findings, all fixed in one change:

1. The partition gave every leg plane before the ankle plane to the Leg, though the planes before the leg's root key (`leg_<s>-root-v2.json`, plane 24) are the Trunk's to place. The row now leaves them to the Leg's and the Trunk's partitions.

### Foot, round 7

00:20:14 to 00:20:37 +09:00, 2026-10-28. A full round. Read whole: this plan's lines 1 to 324 and 450 to 501; lines 325 to 449, the other parts' records, were unchanged since round 6 read them, and the plan's hash was the same at the round's start and end (`Get-FileHash`). The fitter files were reviewed from round 2's whole reads; a count of the directory's files written after 22:00 printed 0. Findings: none.

### Foot, round 8

00:22:41 to 00:23:30 +09:00, 2026-10-28. A check of the survey's Foot subsection, which the plan's rounds 3 to 7 cite but did not reread. Read: the survey's Foot subsection from its heading to "World-height foot calibration" (the rest was read in round 2 and has not changed since); `foot-survey.txt` lines for planes 209, 214 and 216 (grep). The plan itself was not changed by this round. Findings, all fixed in one change:

1. The heel sentence gave plane 214's reach behind the ankle from the right side (-8.1 mm) and its lowest point and plane 216's from the left (6.54 and 0.07 mm). It now gives both sides: -7.9 / -8.1, 6.54 / 6.71 and 0.07 / 0.13 mm.

### Foot, round 9

01:10:35 to 01:21:43 +09:00, 2026-10-28. A review of the Foot section against the owner's Order 2 (module frames anchored at centres a general rule derives, everything stated relative to them, f1 numbers only as illustration). Read whole: the owner's orders file; the common rules; this plan's lines 1 to 505 (shared method, Retirement, Trunk, Hand, Foot); the Integration section's "Frames, anchors and joints", "Export" and "Requests" (`awk` print of their lines). Read in part: `foot_l`'s bind record in `body-observations.json` (grep). Command: `footFrames.ts` (survey commands), output `.shots/claude-scratch/foot/foot-frames.txt`. Findings, all fixed in one change:

1. Plane indices of f1's leg family defined the ankle plane (209), the heel's planes (209..216, 197..208), the key candidates (210..243, 244..247) and the partition (to 208, 210..247). Each is now a rule in the foot frame: the plane through the ankle joint centre, the planes within the ankle's turn, the planes meeting neither end plane, negative and positive foot station; f1's planes only illustrate.
2. No module had a frame of its own: the keys' axes started from the planner's world-forward or world-up u, and nothing declared an anchor. The section now opens with Module frames: anchors `foot_<s>` and each toe's `_01`, axes from bind joint centres by cross products (Wu et al. 2002), phase 0 dorsal, stations from the anchor, the anchor frame as the Integration section defines it; the survey's defect table carries the world-axes defect.
3. The toe numbers were a table from family names. `k` is now the toe's medial-to-lateral rank along the bend axis toward the other ankle (`foot-frames.txt`: the same order on both sides).
4. The outputs did not record anchors or declared joints, which Integration asks of every part. They now do, and Requests answers Integration.
5. The observation request fixed the toe planes' spacing at 2 mm and the key request named planes 244..247. Both now state the rule and give f1's numbers as illustration.
6. The `exportModules.ts` request went to Method, though Integration owns the exporter. It now goes to Integration.

### Foot, round 10

01:22:52 to 01:28:21 +09:00, 2026-10-28. Begun as a full round. Read whole: this plan's lines 1 to 781 (shared method to the Integration section's defect table), in five reads. The shared method had changed since round 9: anchors from the joints' bind affines, poles at the Morse terminal, admissible key planes, the observation families' succession and continuation, the strips record, and the deletion of the old foot tools. The round stopped there to bring the Foot section to it, so it is not a full round. Findings, all fixed in one change:

1. The Foot's frames took their axes from joint centres as the anchor itself, against the shared rule that the anchor is the joint's bind frame. The anchors are now the bind frames of `foot_<s>` and each toe's `_01`; the joint-centre axes stay as the module's anatomical directions (phase origin, medial side), and Requests names the conflict between the shared text and the Integration and Hand texts.
2. The foot's pole was the farthest observed point before the strip split; the shared Caps rule now takes the terminal, which for the foot is the first web saddle past the heads loop. The Top end now takes it, and the cycle argument rests on the terminal coming from the mesh before any fit.
3. The toes' run, root and tip duplicated rules the shared method now holds, with the `-root-v2` roots. They now cite the shared Observation families and Roots, the `-v3` families and `-root-v3` roots, and the terminal maximum.
4. The foot base was said to fit on the current files, but its pole and the toes' `-root-v3` loops come from Method's observation run. The precondition now says what the foot needs from that run.
5. Requests repeated five changes the shared method now carries (succession, the strips record, admissible planes, the deletions, the exporter's comments). They are gone; one request remains for Method, the heads loop's terminal seed.
6. Key candidates restated a rule the shared method now holds. They now cite the admissible planes.

### Foot, round 11

01:28:43 to 01:34:16 +09:00, 2026-10-28. Begun as a full round. Read whole: this plan's lines 1 to 497 (the shared method, Retirement, Trunk, Hand to its Digits); search: `### Frames, anchors and joints` with its eight following lines, and `plane function` over the plan. The shared method had changed again: named axes declared beside the bind-frame anchor, a child's axes carried from its parent's, in-plane axes from the front axis, and keys at evenly spaced admissible stations in the plane function's planes; the Integration section now takes the shared anchor. The round stopped to bring the Foot section to it, so it is not a full round. Findings, all fixed in one change:

1. The toe axes took the foot's `e2` by Gram-Schmidt; the shared Named axes carry a child's axes from its parent's. They are now carried by the least rotation from the foot's `e1` to the toe bone, and the roles (along, front, lateral) are named.
2. The keys still moved to the nearest admissible family plane; the shared Keys put them at evenly spaced admissible stations in the plane function's planes. The foot's key planes are now the leg's plane function, its keys at admissible stations, the family planes only observations; the toes' keys likewise.
3. The in-plane axes restated a rule the shared Representation now holds. They now cite it.
4. Requests asked Method and Integration to reconcile the anchor texts, which now agree, and asked Method for the heads seed as a change, where Retirement step 1 takes each part's named seed. The anchor request is gone; the seeds are named in the section and in one request for the observation run.

### Foot, round 12

01:34:34 to 01:37:48 +09:00, 2026-10-28. Begun as a full round. Read whole: this plan's lines 1 to 661 (the shared method through the Foot section); search: Foot, toe, ankle and ball lines of the Integration section (`grep -i` over an `awk` print of it). The round stopped at the findings, so it is not a full round. Findings, all fixed in one change:

1. The partition split the foot's nodes from the toe strips' by their feet on the foot's start surface, but the shared Observations and weights fix every label before any surface exists. The partition now gives the joined skin to the foot and removes toe skin seen by other families as skin components of the mesh, seeded at each toe's terminal, the Hand's digit rule; the strips have no observations of their own and stay straight blends (shared Strips).
2. The trims were cut on the start surface. They are now cut on the fitted foot, after the foot and the toe, as the strip method runs.
3. The shared Caps rule now takes `cap.from` as the last station whose section is wholly the module's own skin. The Top end now states that the heads section must be so and that the fitter checks it.
4. The foot base's precondition named only its own terminal and the toes' roots; the skin components also need the toes' terminals. It now names them.

### Foot, round 13

01:38:06 to 01:39:05 +09:00, 2026-10-28. Begun as a full round. Read whole: this plan's lines 1 to 205 (unchanged in substance since round 12) and the Foot section (an `awk` print of it from its heading to the Leg's). The main agent's message asking for the terminal pole, keys at admissible stations of the plane function, `-root-v3.json` roots and the declared anchor, named axes and joints arrived during it; all four were already in the section. The round stopped at its finding, so it is not a full round. Findings, all fixed in one change:

1. Outputs listed the anchor joint and frame and the declared joints but not the named axes, which the shared `anchor` field carries. They now list them.

### Foot, round 14

01:39:21 to 01:42:23 +09:00, 2026-10-28. Full round. Read whole: this plan's lines 1 to 811 (shared method, Retirement, Trunk, Hand, Foot, Integration) and the Foot output files cited (`foot-survey.txt` lines with `148.98`, `145.8` and `ball`, by a search). The fitter directory holds no file written since 22:00 on 2026-10-27 (`Get-ChildItem` count 0). Findings, all fixed in one change:

1. Module frames declared each toe's `_01` at station 0 while stating that `_01` lies before the toe chain's first station, and `ball_<s>` at 148.98 mm, past the heads key's 145.8 mm where the cap formula's planes begin; the shared Declared joints give a station only where the joint's plane lies in the module's station range. The bullet now gives every declared joint its point and a station only inside the range from the first key to `cap.from`, so `ball_<s>` and a toe's `_01` carry their points only on f1.
2. Outputs said the declared joints carry "their stations"; they now carry their points and the stations Module frames gives them.

### Foot, round 15

01:42:41 to 01:45:59 +09:00, 2026-10-28. Read whole: a snapshot of this plan taken at the start, lines 1 to 370 (shared method, Retirement, the Trunk's opening), against the Foot section as round 14 left it; `foot-key-planes.txt` whole and `foot-survey.txt` by a search for the plane stations and root loops. The fitter directory holds no file written since 22:00 on 2026-10-27 (`Get-ChildItem` count 0). The Hand, Trunk and Integration sections were not reread, so this is not a full round. Findings, all fixed in one change:

1. The foot's top end key lay on the metatarsal heads' site plane, against the shared Representation (a key's plane is the module's plane function at its station), Keys and control counts ("no key sits at a joint or a site by rule") and Caps (`cap.from` the last station whose section is wholly the module's own skin), and against the Hand's palm, which keeps its heads plane an observation. The end key now lies in the plane function's plane at `cap.from`, the last leg-family plane holding no node of a toe rooted across the foot's end, the Hand's rule; the heads plane is an observation, its survey fact the reason it is no key; the terminal is seeded with the end key's own loop; a maximum terminal stops the fit. Key planes, Top end, Keys, Files, the defects table and Requests follow, and a request asks Method to drop its stale heads-plane example.
2. The introduction named the heads' site among what places the Foot's modules; it now names the families' topology and the toes' skin components.
3. Module frames gave `ball_<s>` no station because it lay past the heads station; it now carries its station when its centre plane lies at or before `cap.from`.

### Foot, round 16

01:46:27 to 01:48:10 +09:00, 2026-10-28. Full round on a snapshot taken at its start: lines 1 to 370 compared line by line with round 15's snapshot (no difference), the rest of the plan compared with it by `diff` and every changed line read (Trunk outputs and requests, Hand palm and strips, Foot, Integration's JointCentres, SkinTone and requests, the new Self-review records), the Foot section read whole, and the survey's Foot subsection read whole (its lines 436 to 500). The fitter directory holds no file written since 22:00 on 2026-10-27 (`Get-ChildItem` count 0). Findings, all fixed in one change:

1. Top end said the `cap.from` plane holds "no node of a toe", where it means no node on that toe's skin component of the Data partition, as the Hand now states for the palm. It now says so.
2. Integration's Export 5 converts or copies a fit's keys by what "each fit's record" says of their frame; the Foot's outputs did not say their record states it. They now state that the keys and pole are in the registered world frame.

### Foot, round 17

01:48:25 to 01:49:22 +09:00, 2026-10-28. Full round on a snapshot taken at its start: lines 1 to 370 compared line by line with round 16's snapshot (no difference), the rest compared by `diff` and every changed line read (Trunk reliefs and fitter changes, the Foot, Integration's Arm and Leg request, the Hand, Trunk and Integration records), and the Foot section read whole. The fitter directory holds no file written since 22:00 on 2026-10-27 (`Get-ChildItem` count 0). Findings, all fixed in one change:

1. The foot's terminal seed, the plane at `cap.from`, is derived from the toes' skin components, which need the toes' `-root-v3` loops and terminals, so it cannot be named before those exist (the Hand records the same for the palm). Toes, Precondition and the Method request now order the foot's terminal after the toes' roots and terminals within Retirement step 1.

### Foot, round 18

01:49:35 to 01:50:36 +09:00, 2026-10-28. Full round on a snapshot taken at its start: lines 1 to 370 compared line by line with round 17's snapshot (no difference), the rest compared by `diff` and every changed line read (the Foot's own round 17 changes and the Hand's round 18 record), and the Foot section read whole for Order 2. The fitter directory holds no file written since 22:00 on 2026-10-27 (`Get-ChildItem` count 0). Findings, fixed in one change:

1. Module frames stated as a rule that a toe's root lies distal of its `_01`, which holds on f1 but no rule guarantees. It now gives `_01` and `_02` their stations only when their centre planes lie between the root key and `cap.from`, and cites f1's roots, 14.0 to 18.0 mm past `_01` (`foot-survey.txt`), as the illustration.

### Foot, round 19

01:50:51 to 01:53:05 +09:00, 2026-10-28. Full round on a snapshot taken at its start: lines 1 to 370 compared line by line with round 18's snapshot (no difference; read whole in round 15 and unchanged since), the rest compared by `diff` and every changed line read (the Foot's round 18 change, Integration's Documents and Files lists, the Foot round 18 record), the Foot section read whole against Order 2 and the shared rules, a search of it for `heads`, plane numbers and `index`, and every f1 number it cites checked against `foot-survey.txt` and `foot-frames.txt` by a search. The fitter directory holds no file written since 22:00 on 2026-10-27 (`Get-ChildItem` count 0). Nothing found: every Foot module is anchored at a bind joint's frame with axes from joint centres, its stations, keys, caps, poles and trims stated relative to it, every f1 number an illustration, and no plane index, absolute coordinate or name special case defines a rule; the only plane numbers left quote Method's example in the Foot's request to Method.

### Hand, round 1

00:31:33 to 00:33:00 +09:00, 2026-10-28. Read whole in the round: this plan; `exportModules.ts` (lines 1 to 100; 100 to 180 were read before the round). Read in part: `IAutoMovieRecoverySectionsInput.ts:20`-`:45` and `IAutoMovieRecoverySections.ts:45`-`:70`. The other files the Hand section names (`fitBodyBase.ts`, `fitAppendage.ts`, `fitStrip.ts`, `findRootKeys.ts`, `planBodySections.ts`, `observeBodySections.ts`) were read whole before the round, so this is not a full round. Findings, all fixed in one change:

1. The tip pencil's plane count, the family spacing fitted in the end loop's half perimeter, is a rule no citation gives. Recovery's section API already reports a followed loop's source extremum (`terminalSeeds` and `terminals`), as the Foot plan uses for the toes. The digits' pole is now the terminal; the pencil is gone from Digits, the partition, the defect table and Requests.
2. The palm's key candidates were called parallel, but planes 129 onward lie inside the wrist's turn. Palm now cites the planner's half-width for them and parallelism only past the turn.
3. The thenar sentence said the hand's two masses "are joined", which the anatomy note does not say. It now cites the note for the thenar as the thumb's pyramidal base and keeps the joining to the observations.
4. The skin component cited `observeBodySections.ts:80`-`:113` for its weld, a range that also joins the head mesh, which the components do not use. It now cites the registration (`:105`) and the weld (`:95`-`:104`).
5. Digits did not say whether the palm waits for the new digit families. It now says the palm and the Arm fit on the current files.

### Hand, round 2

00:33:56 to 00:41:42 +09:00, 2026-10-28. Read whole, through numbered listings: `fitAppendage.ts`, `findRootKeys.ts`, `planSitePlanes.ts`, `fitBodyBase.ts`, `fitStrip.ts`, `planBodySections.ts` lines 93 to 216 (lines 1 to 92, the trunk branch and the usage, were read whole earlier in the session). Not reread in this round: this plan (read whole in round 1), `observeBodySections.ts` and `exportModules.ts` (read whole earlier in the session), so this is not a full round. Findings, all fixed in one change:

1. The digit planes turn only at `_02`: the extension continues the last bone, so `_03` is straight (`planBodySections.ts:177`-`:186`). Digits' frame and the survey said they turn at `_02` and `_03`; both now say `_02` only.
2. The survey said the digit planes run every 2 mm from `_01`; they are counted from each joint (`planBodySections.ts:193`-`:196`). It now says so.
3. `fitStrip.ts` reads the `-root-v2` loop (`:120`-`:122`), which differs from the separated root on three digits, and gives the strip the digit's planes before the `-root-v2` index (`:367`-`:378`), which the Hand partition gives the palm. The strip request and the survey's fitter paragraph now name both.

### Hand, round 3

00:44:41 to 00:48:06 +09:00, 2026-10-28. A full round. Read whole: this plan, including the Integration section added during the round; `planBodySections.ts` lines 1 to 92 and `observeBodySections.ts`, through numbered listings. The other fitter files the Hand section names were read whole in round 2 (`exportModules.ts` in round 1 and before it); a listing of the directory's files written after 22:00 printed none. The survey script `surveyHandComponents.ts` was rerun with the observer's weld precision (1e-4 mm instead of 1e-3 mm), and its output did not change (`diff`). Findings, all fixed in one change:

1. Recovery's appended planes were called the run's continuation, yet `cap.from` stayed the run's last plane and the partition listed them apart from the run. The run now includes the appended planes that succeed it, `cap.from` is its last plane with them, and the terminal row holds only the pole.
2. The palm's pole value came from 8 points per Hermite span, which the plan did not say. It now says so and that the fitter takes the point from the spans.
3. The palm's N limit named "the palm skin's largest loop", though the largest loop (a thumb section) also holds digit skin. It now names the largest loop among the palm's sections.
4. The defect table still called the palm's keys parallel. It now says family planes the planner keeps from crossing.
5. Integration owns `exportModules.ts` (its section, Export); the request to add `fitHand.ts` to its comment now goes to Integration.

### Hand, round 4

00:48:18 to 00:51:27 +09:00, 2026-10-28. A check of the survey's Hand subsection, which the plan cites. Read whole: the survey's Hand subsection. Not read in this round: the plan, so this is not a full round. Command: `node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/hand/surveyHandHeadsCrossing.ts test/.shots/f1 .shots/claude-scratch/hand/survey-heads-crossing.txt`. Findings, all fixed in one change:

1. The survey's defect "palm keys crossing the end key" and the plan's reason for never keying the heads plane rested on no measurement. The new script prints that palm planes 145..150 meet the heads plane inside both loops and 129..144 inside neither; the survey's heads bullet and defect row and the plan's Palm now cite it, and Palm says the Foot plan's key-candidate request never binds the palm.
2. The survey and the thenar sentence called `thumb_01`-`thumb_02` the first metacarpal, a reading of the bind skeleton's names that no source here states. Both now name the joints only.

### Hand, round 5

00:58:11 to 00:58:38 +09:00, 2026-10-28. A full round. Read whole: this plan, lines 1 to 880 (the Trunk records included). The fitter files the Hand section names were reviewed from round 2's whole reads (`planBodySections.ts` lines 1 to 92 and `observeBodySections.ts` from round 3's, `exportModules.ts` from round 1's and before); a count of the directory's files written after 22:00 printed 0. The survey's Hand subsection was read whole in round 4 and not changed since. Findings: none.

### Hand, round 6

A review of the Hand section against the owner's Order 2 (module frames at centres a general rule derives), assigned by the main agent; no start time was taken, the changes ended at 01:14:40 +09:00, 2026-10-28. Read whole: `owner-orders.md`; this plan's Hand section. Read in part: `AutoMovieHumanFeatureChain.ts:200`-`:262` (the shared-end override), `measureIdentity.ts:551`-`:558`. This is not a full round. Findings, all fixed in one change:

1. No Hand module had a frame of its own: stations ran from the arm family's shoulder plane, in-plane axes came from the planner's world-forward reference, and the pole and key frames were world points. A new Frames subsection gives the palm a frame at the wrist joint (hand bone, knuckle line, palm normal mirrored by side) and each digit one at its first joint, stations from those origins, `u` from the palm normal carried by rotation-minimising transport, and the fit record in frame coordinates, citing hierarchical modelling (Foley et al. 1990, ch. 7). The shared-end override signs the owner's derivatives into the sharer's station (`AutoMovieHumanFeatureChain.ts:217`-`:251`), so the palm's own station origin needs no common origin with the arm; the Arm request says so for `fitAppendage.ts:147`.
2. Plane indices defined the palm's ends, key candidates and partition (129, 150, 130..149, to 128). They are now the planes through the wrist joint and `middle_01` and the planes strictly between or proximal of them; indices stay only as f1 illustrations.
3. The family `pinky`'s chain name read as a special case. Each digit now declares its name in `HandGeometry.ts`'s table, and no rule reads a name for geometry.
4. The thenar rule was stated for the thumb at `thumb_02`; it is now general (joined skin proximal of any separated root is palm), with f1's thumb as the example. The defect table and the 2 mm spacings likewise now cite f1 only as illustration.
5. Key frames and poles are world coordinates in the chain representation, so no module can be transformed as one frame. Requests asks Method for a placement in `IAutoMovieHumanFeatureChain`.

### Hand, round 7

01:15:33 to 01:17:16 +09:00, 2026-10-28. Read whole: this plan's lines 1 to 670, everything but the Self-review records; the Integration section had gained "Frames, anchors and joints" and a request that every part name its anchors and declared joints. Not read in this round: the records, so this is not a full round. Findings, all fixed in one change:

1. Integration asks each part for its modules' anchor joints and declared bind joints with their stations; the Hand named neither. Frames now names the anchors (`hand_<s>`, each digit's `_01`) and the declared joints with the station rule.
2. The Hand's own request for a placement in the chain duplicated Integration's anchor request in other words. It now joins Integration's, and notes that the Hand's first key frames take `u` from the palm frame, so the anchor axes Integration reads from them are bind-derived.

### Hand, round 8

01:17:31 to 01:18:40 +09:00, 2026-10-28. Read whole: this plan's lines 1 to 439 (to the end of the Hand section; the Trunk section had been rewritten on its own frame). Not read in this round: the Foot and Integration sections and the records, so this is not a full round. Findings, all fixed in one change:

1. The declared joints named `thumb_01` and `thumb_02` for both the palm and the thumb, and every digit's `_01` for the palm and the digit, so a joint would map through two anchors. Each joint is now declared by one module: the palm `hand_<s>`, each digit its `_01` to `_03`.
2. The Integration request still told Integration to take the wrist from the arm's end and the digits' joints from chain stations, which Integration's section has replaced by declared bind joints. It now says what the Hand supplies for that: the declared joints and the digits' poles.

### Hand, round 9

01:18:54 to 01:22:13 +09:00, 2026-10-28. Read whole: this plan's lines 1 to 675, everything but the Self-review records (Integration's anchor now takes each part's own frame with the role of each axis, and its landmark row reads the palm frame's palmar axis). Not read in this round: the records, so this is not a full round. Command: `node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/hand/surveyHandFrame.ts test/.shots/f1 .shots/claude-scratch/hand/survey-frame.txt`. Findings, all fixed in one change:

1. The palm frame's `e3` took its sign from the side name and was said only to point to "the same anatomical side", so no axis had a stated role, and Integration's anchor needs one. `e3` now takes the sign that puts `thumb_01` on its positive side, the palmar side by the anatomy note's placement of the thumb's carpometacarpal joint; the new script prints that `thumb_01` and every finger's `_02` and `_03` lie on that side on f1, and the survey records it. Frames states the roles of `e1`, `e2` and `e3` for the palm and the digits.
2. The representation request still said Integration took anchor axes from the first key frame; Integration's section now takes the part's frame. The request now names the palm and digit frames and the palmar axis `AutoMovieHumanSkinLandmarks` reads.

### Hand, round 10

01:22:26 to 01:25:37 +09:00, 2026-10-28. Read whole: this plan's lines 1 to 351 (the Shared method, rewritten with Module frames and handles, the terminal as every pole, Observation families and Strips, and Retirement); the Hand section; a search for the anchor wording over the whole plan. Not read in this round: the other parts' sections and the records, so this is not a full round. Findings, all fixed in one change:

1. The shared method's anchor is the bind affine of the module's first joint, which the Hand did not name. Frames now states it as the anchor, with the palm and digit frames built in its coordinates for the keys' axes and roles, and Requests asks Method and Integration to agree on one anchor, since Integration's section takes a part's frame.
2. The shared Caps rule now takes every pole from the module's terminal; the palm's pole was its farthest observed point. The palm's pole is now its terminal, the first web saddle, and a digit's the single-tip maximum.
3. The shared method now carries the `-v3` families, the sibling-bone roots in `-root-v3.json` and the `strips` record, which the Hand requested. Digits, Digit strips, Files, the partition and the defect table now read them, and the four requests are one line.

### Hand, round 11

01:25:52 to 01:28:38 +09:00, 2026-10-28. Begun as a full round; read this plan's lines 1 to 179 when a finding stopped it, so it is not a full round. Findings, all fixed in one change:

1. The shared partition labels each node once and before any surface exists (Observations and weights), but the strips took the palm's nodes inside the trim region on the fitted palm, which both needs a surface and gives those nodes two modules. The strips now have no observations: no interior row, and the reach at the straight blend, 1, since nothing can choose it; Requests asks Method to state that case. The strip record and the defect table follow.

### Hand, round 12

01:28:49 to 01:33:20 +09:00, 2026-10-28. Begun as a full round; read this plan's lines 1 to 337 and the Integration section's "Frames, anchors and joints", then the Hand section, when findings stopped it, so it is not a full round. The Shared method had changed again: named axes (along, front, lateral) beside the bind-affine anchor, with front dorsal for a hand; keys at evenly spaced admissible stations on the module's plane function, no longer moved to observed planes; Integration now takes the same anchor and named axes. Findings, all fixed in one change:

1. The palm's normal pointed palmar and keys took `u` from it, but the shared named axes make a hand's front dorsal and start every key's `u` from the front axis. Frames now names along, front (dorsal, the side away from `thumb_01`) and lateral for the palm and the digits, `u` from front, and palmar as minus front for the landmarks and nails.
2. The palm and digit keys still moved to the nearest family plane; the shared rule now places them at evenly spaced admissible stations on the plane function. Palm and Digits now say so, and their planes are the family's plane function.
3. The request asking Method and Integration to agree on an anchor is moot: both now take the bind affine with the part's named axes. It is gone.
4. Digits said the palm fits on the current files, but its partition reads the separated roots of `-root-v3.json` and its pole is a terminal, both observed in Retirement step 1. It now waits for that step, as the digits do.

### Hand, round 13

01:33:33 to 01:38:08 +09:00, 2026-10-28. A full round: read this plan's lines 1 to 807 (Shared method, Retirement, Trunk, Hand, Foot, Integration) and the survey's "Hand" line on the root loops past plane 150. Findings, all fixed in one change:

1. The shared Caps rule now gives `cap.from` as the last station whose section is wholly the module's own skin by the partition, and seeds the terminal with the loop in the end key's own plane. The palm put `cap.from` at the family's last plane, whose section holds pinky skin past the pinky's root (the pinky's root loop reaches from 6.5 / 6.4 mm before that plane to 1.6 / 1.7 mm past it, survey). Palm, Top end now takes the last plane in the palm's range with no node of a digit whose root loop reaches past the family's last plane; a digit rooted wholly before it (the thumb on f1) is a hole its trim covers. The Cap bullet seeds the terminal in the end key's plane, which `HandGeometry.ts` names, and its observations past `cap.from` shape the cap.
2. The shared Strips now state that a strip with no observation keeps reach 1, so the Hand's request for it is gone and Digit strips cites shared Strips.
3. The Arm modules' comment request on `exportModules.ts` was already Integration's Export 6 (the arm's comment names `fitHand.ts`). It is gone.
4. The defect row "palm keys crossing the end key" still said the keys are family planes at `middle_01`'s end, and Files listed "key candidates"; both now follow the shared admissible stations and `cap.from`.

### Hand, round 14

01:38:10 to 01:39:14 +09:00, 2026-10-28. Begun as a full round after the main agent's relay of Method's requests (front-axis `u`, terminal pole, `-root-v3.json`, anchor, named axes and declared joints), which rounds 12 and 13 had already applied; read this plan's lines 1 to 340 and the Hand section (465 to 568) when findings stopped it, so it is not a full round. Findings, fixed in one change:

1. The palm's Cap bullet credited the shared Caps rule with stopping on a terminal that is no splitting event, but the shared rule accepts a single-tip maximum. The stop is the Hand's own check, a palm with no digit beyond it, and now says so.
2. The digits' pole named only the maximum, where the shared rule takes the first splitting event before it; it now states the shared rule with the fingertip's maximum as its case.

### Hand, round 15

01:39:15 to 01:41:20 +09:00, 2026-10-28. A full round: read this plan's lines 1 to 812 (Shared method, Retirement, Trunk, Hand, Foot, Integration). Findings, fixed in one change:

1. Integration's Export 5 now converts a fit's keys and pole by whether the fit's record gives them in the world or the anchor's coordinates, but the Hand's Outputs named neither the anchor, axes and joints record nor the frame of the keys. Outputs now lists them, the keys and pole in the world.
2. The Foot's toe skin components cite "the Hand's digit rule" but seed at the toe's terminal, while the Hand seeds at the vertex nearest the `_02`-`_03` midpoint, the rule the survey measured. Requests now asks the Foot to cite its seed as its own or agree on one.

### Hand, round 16

01:42:46 to 01:44:39 +09:00, 2026-10-28. Begun as a full round on a copy of the plan taken at its start (`.shots/claude-scratch/hand/plan-round16-start.md`); read the Hand section (its lines 465 to 568) and `techniques/surface-composition.md`'s lines on junctions and webs when findings stopped it, so it is not a full round. Findings, fixed in one change:

1. Palm, Planes said the arm family's planes are stored in the anchor's coordinates, but observations stay in the registered world frame (shared Module frames and handles); only the key planes the plane function gives are stored in the anchor's. It now says so.
2. "Surface composition" named no section of this plan; it is `techniques/surface-composition.md`, now linked, with its sentence on webs quoted.
3. Palm, Top end said "no node of a digit" where it means no node on that digit's skin component of the Data partition; it now says so.

### Hand, round 17

01:45:28 to 01:46:25 +09:00, 2026-10-28. Begun as a full round on a copy taken at its start (`.shots/claude-scratch/hand/plan-round17-start.md`): read its lines 1 to 366 (Goal, Shared method, Retirement), the diff of the whole plan against round 16's copy (the Trunk's Outputs and Integration request, Integration's SkinTone row and requests), and the Hand section as edited. One finding stopped it, so it is not a full round:

1. Retirement step 1 observes every capped module's terminal from the seed its part names, but the palm's seed plane, at `cap.from`, is derived from the separated roots and the skin components, so it cannot be named before the `-root-v3.json` files exist. Digits, Preconditions now orders the palm's terminal after the digits' roots within that step.

### Hand, round 18

01:47:15 to 01:48:33 +09:00, 2026-10-28. A full round on a copy of the plan taken at its start (`.shots/claude-scratch/hand/plan-round18-start.md`): read its lines 1 to 815 whole (Goal, Shared method, Retirement, Trunk, Hand, Foot, Integration) and its diff against round 17's copy (the Foot's new `cap.from` rule, Integration's joint-centre radius and Arm and Leg request). The fitter files are unchanged since round 2, and no rule of the Hand section was found to fail Order 2 (frames anchored at bind joints, stations, keys, caps, trims and poles relative to them, f1's numbers illustrative, no plane index, absolute coordinate or name special case) or to contradict another section. Nothing found; the Foot request of round 15 still holds, since the Foot's toe components still seed at the terminal.

### Trunk, round 1

00:30:37 to 00:45:28 +09:00, 2026-10-28. Read whole: this plan (lines 1 to 602 at the round's start). Read in part: `fitTrunkBase.ts:52`-`:70`, `:117`-`:235`, `:400`-`:430` and `fitTrunkReliefs.ts:28`-`:45`, `:96`-`:142`; the rest of both files was reviewed from this session's whole reads before the round (both last written 2026-10-27 18:22), so this is not a full round. Also read: `f1-identity.json`'s `diagnostics.acromia` and `measureIdentity.ts:430`-`:446` (searches for `acromi`); `sources/ansur-ii.md` (search for `armscye|axill|acromi`). The main agent's finding of 00:38 arrived during the round. Command: `node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/trunk/trunkPartition.ts test/.shots/f1 .shots/claude-scratch/trunk/trunk-partition.txt`, rerun after each script change, last output `.shots/claude-scratch/trunk/trunk-partition.txt`. Findings, all fixed in one change:

1. The root cut took a row's crossing within twice `policy.toleranceMm` of the root loop; the factor 2 had no source (main agent). The cut is now found by intersection with no tolerance: each point where the root loop meets the row's plane takes the row's nearest crossing of the root's plane. It cuts the same rows at two crossings each; the survey gives the partner and non-partner distances.
2. The Across Shoulder course's ends were called the acromia; they lie at z ±132.9 mm and 1405.9 mm high, `measureIdentity.ts`'s acromia at z ±180.9 mm and 1388.2 mm. Both documents now call them the course's shoulder points, and the survey and the partition record the plane through the identity acromion, which crosses 289 rows and bounds nothing.
3. The armscye citation named ISO 8559-1:2017 from memory, unread. It is gone; the citation is ANSUR II's acromion and axilla, as the repository's ANSUR II notes hold them.
4. The pole broke the shared Caps rule without saying so: the farthest observed point ties across a horizontal lowest row. Bottom end now says so, and Requests asks Method to name the exception.
5. Keys moved to the nearest row "holding a loop", a departure from the shared key rule with no reason. They now move to the nearest family row.
6. The partition gave no order for a node two rows of its table hold. A node now takes the first row that holds it; the relief row said "samples" for nodes.
7. The window's medial extreme was taken over every station, the cap's included, where phases carry no midline. It is taken from `cap.from` up.
8. "Inside the leg trims" claimed a trim not yet computed. The sentence now names the rows the leg loops cut.
9. The breast region gave the fold's height at two precisions. It is 1337.1 mm.
10. Neither fitter's doc comment was named among the changes. Both are now rewritten.

### Trunk, round 2

00:47:09 to 00:52:23 +09:00, 2026-10-28. Read whole: this plan's Trunk section; `fitTrunkBase.ts:1`-`:51`, `:70`-`:117` and `:235`-`:604`, and `fitTrunkReliefs.ts:1`-`:27` and `:44`-`:96`, which with round 1's parts cover both files. Not read in this round: the plan outside the Trunk section, so this is not a full round. Findings, all fixed in one change:

1. "With that cut" followed the sentence on the identity acromion's plane, so it named the wrong plane. It now says the armscye cut.
2. The saved loft's exclusion claimed it observes "the same skin", unmeasured. It now gives its 10 mm rows from the survey.
3. The abdominal band's removal said the station penalty "spreads nothing across the section", which states no cause. It now says no layer is fitted to a row.
4. The reliefs were fitted to "every trunk observation" in their windows, which would take the limb and strip arcs. They now take the nodes the partition gives the base or that relief.
5. The changes kept no vector helpers and left the `composed` switches and the `-128` output name unnamed. They are now named.

### Integration, round 1

00:45:29 to 00:59:55 +09:00, 2026-10-28 (the session was paused by a usage limit inside the round). Read whole: this plan, lines 1 to 632 then (my section and every section above it); `survey.md` before my edits; `packages/human/src`: `AutoMovieHuman.ts`, `generation/AutoMovieHumanBodyCalibration.ts`, `AutoMovieHumanBodyRegions.ts`, `IAutoMovieHumanBodyRegion.ts`, `IAutoMovieHumanBodyCalibration.ts`, `AutoMovieHumanBodyLaw.ts`, `AutoMovieHumanBodyConstruction.ts`, `AutoMovieHumanBodySurface.ts`, `AutoMovieHumanBodyStrip.ts`, `AutoMovieHumanBodyRoots.ts`, `AutoMovieHumanBodyApertures.ts`, `IAutoMovieHumanSurfaceContext.ts`, `IAutoMovieHumanSurfaceBoundary.ts`, `IAutoMovieHumanBodyMorph.ts`, `AutoMovieHumanBodyTree.ts`, `AutoMovieHumanBodyGirth.ts`, `AutoMovieHumanBodyLandmarks.ts`, `AutoMovieHumanBodyWarpField.ts`, `AutoMovieHumanBodyWarp.ts`, `AutoMovieHumanEventJoin.ts`, `AutoMovieHumanStationContinuity.ts`, `AutoMovieHumanSectionLoops.ts`, `AutoMovieHumanContactSmoothing.ts`, `AutoMovieHumanLipSmoothing.ts`, `AutoMovieHumanCornerSmoothing.ts`, `lofting/IAutoMovieHumanLoftChain.ts`, `AutoMovieHumanLoftChain.ts`, `AutoMovieHumanLoftJet.ts`, `AutoMovieHumanLoftStations.ts`, `AutoMovieHumanLoftMesh.ts`, `IAutoMovieHumanLoftAperture.ts`, `network/IAutoMovieHumanFeatureChain.ts`, `AutoMovieHumanFeatureChain.ts`, `IAutoMovieHumanRelief.ts`, `AutoMovieHumanRelief.ts`, `skeleton/AutoMovieHumanJointCentres.ts`, `appearance/AutoMovieHumanHeadField.ts`, `AutoMovieHumanGarmentBody.ts`, `AutoMovieHumanSkinChart.ts`, `AutoMovieHumanSkin.ts`, `AutoMovieHumanSkinTone.ts`, `AutoMovieHumanSkinLandmarks.ts`, `AutoMovieHumanFaceTone.ts`, `AutoMovieHumanSkinMarks.ts`, `AutoMovieHumanNail.ts`, `AutoMovieHumanShoulderField.ts`, `AutoMovieHumanBrowProjector.ts`, `IAutoMovieHumanAppearanceBody.ts`; `packages/playground/src/human/`: `HumanCaptureCamera.ts`, `drawHumanPageCurveDiagram.ts`, `resolveHumanCurves.ts`, `drawHumanCurveDiagram.ts`, `HumanViewerModel.ts`, `mountHumanViewerPage.ts`, `layoutHumanViewerPage.ts`, `createHumanPartStyle.ts`; `packages/playground/src/human-images/createHumanImagePlugin.ts`, `HumanImageSession.ts`, `HumanImageSourceIdentity.ts`; `exportModules.ts`; `docs/techniques/section-chain-lofting.md`; the fitters' `README.md`; `.agents/skills/human/verification.md`, `screenshot.md`. Read in part: `AutoMovieHumanAppearance.ts:40`-`:239`, `AutoMovieHumanSkeleton.ts:1`-`:140`, `AutoMovieHumanVermilionCalibration.ts:1`-`:22`, `f1.ts:1`-`:40`, `fitAppendage.ts:60`-`:80`, `:195`-`:235`, `:320`-`:345`. Searches: imports of the deleted files over `packages/human/src`; `AutoMovieHumanStretchProfile|AutoMovieHumanMonotoneCubic|IAutoMovieHumanBodySpecimen`; the stature fractions over `docs/anatomy`; `humanImageProcessEntry.ts` for reload and renderer lines. Not read: the four retired literal files (single lines of data), checked through their importers. Findings, all fixed in one change:

1. The chordal `samples` rule alone would draw the lip colour boundary and every opening's cut on cells sized for the surface, since the generator refines only stations near them. Export 3 and Replacement step 6 add the same refinement in phase; Constants carries its constants.
2. `AutoMovieHumanStretchProfile.ts` is imported only by the warp field and was left orphaned; the deletions now take it. The specimen calibration's and `AutoMovieHumanMonotoneCubic.ts`'s fate was unstated; it now is.
3. The joint centres' stature fractions were attributed to `docs/anatomy/skeleton.md`; they are in `docs/anatomy/joint-range.md:76`-`:90`. The plan and the survey now say so.
4. The pick change returned three curves through a handler typed for one id; the plan now changes the handler to a list with its toggle rule.
5. The new window and trim curve ids looked like diagram ids; they are now stated as 3D-only.
6. The plan started the audit viewer on 5173, which another process holds since 2026-10-24 and which the step 3 change would put out of service by its host identity. The audit now runs on a free port unless the main agent hands over 5173; the request is recorded.
7. The `SkinMarks` re-pointing silently lowered the shoulders' and neck's freckle weight; it now states it.
8. Files lacked the surface context and boundary types and `AutoMovieHumanBodyApertures.ts`; Method's request held a sentence about `TOLERANCE` that was no request; a grammar slip in the garment row.
9. Survey: the citation sentence claimed whole reads; the CI log line range was short; the host-identity fault, the in-browser generation and the orphaned files were missing. Fixed.

### Integration, round 2

01:00:54 to 01:03:18 +09:00, 2026-10-28. A full round. Read whole: this plan, lines 1 to 920; the survey's Integration subsection. The code files the section names were reviewed from round 1's whole reads (none of them changed since: this round edits documents only). Read in part: `AutoMovieHumanJointCentres.ts:10`-`:18` (round 1's read, for the citation). Findings, all fixed in one change:

1. The Trunk plan now states that the trunk's station is a height only from `cap.from` up (its round 4). The names table and the joint-centre row said "station the height" without the bound; both now give it and note that the trunk joints lie above it.
2. Survey: `head.lower` is framed (world-chains.txt), but the survey called every chain but the feet's horizontal; the exporter was said to read the palm fit under another name than the Hand's, which it does not (`palm` plus `_l` is `palm_l`); the joint-centre comment names `joint-range.md` for the rules as well as `skeleton.md` for the fractions; `refine` and `detail` were credited to `cut`; the viewer reading list still named part reads that round 1 completed; the deleted-bytes sentence counted twelve files as Retirement's. All fixed.

### Integration, round 3

01:03:41 to 01:04:11 +09:00, 2026-10-28. A full round. Read whole: this plan, lines 1 to 635 (the sections) and the records after them, read in round 2 at 01:01 to 01:03 and grown since only by round 2's record. Read in part: the survey's Integration subsection, the paragraphs round 2 changed. The code files were reviewed from round 1's whole reads, unchanged since. Findings, fixed:

1. The note after Replacement step 9 credited the 0.5 mm, 2 mm refinement to `cut`; it belongs to `refine`. It now says so.

### Integration, round 4

01:05:01 to 01:06:27 +09:00, 2026-10-28. A full round. Read whole: this plan's Integration section (lines 504 to 634) and the survey's Integration subsection. Lines 1 to 503 were read whole in round 3 and had the same MD5 at this round's start and end (`sed -n 1,503p | md5sum`, 94a170916ca40196f3c3ed3ec25614fc); the review records after line 635 were not reread. The code files were reviewed from round 1's whole reads, unchanged since. Findings: none.

Correction recorded in round 9: round 4 did not reread the review records and relied on a hash for lines 1 to 503, so it was not a full round.

### Trunk, round 3

00:53:59 +09:00, 2026-10-28, stopped by a usage limit after reading this plan's lines 1 to 340. Not a full round; no change was made.

### Trunk, round 4

00:58:07 to 01:00:28 +09:00, 2026-10-28. A full round. Read whole: this plan, lines 1 to 886. The fitter files were reviewed from rounds 1 and 2, whose reads cover both files whole; both were last written 2026-10-27 18:22 (listed at the round's start). Findings, all fixed in one change:

1. The window's stations were "the region's heights", but below `cap.from` station is not height, and the buttock bottom lies there. A bottom below `cap.from` now takes the station the cap formula gives its height, the pole key's for the crotch.
2. The dropped region nodes were called "a sliver along the midline", unmeasured. The sentence now only drops and counts them.
3. Integration owns `exportModules.ts` (its section, Export); the exporter request now goes to Integration.

### Trunk, round 5

01:00:46 to 01:01:37 +09:00, 2026-10-28. A check of the survey's Trunk subsection, which the plan cites, and of round 4's change. Read whole: the survey's Trunk subsection; this plan's Trunk section from Reliefs to Requests. Not read in this round: the rest of the plan, so this is not a full round. Findings, all fixed in one change:

1. The survey's armscye paragraph put the identity acromion's plane before "the arm root loop lies ... from it", so "it" named the wrong plane. The root loop's distances now follow the armscye plane directly.
2. The seam bullet called the empty rows "the five open rows above", whose referent lay in another bullet. It now names them by their heights.
3. The Front Interscye row wrote the fold points as `±152.2 / 152.1`, mixing a sign and a side pair. It now gives both points.

### Trunk, round 6

01:01:55 to 01:04:31 +09:00, 2026-10-28. Read whole: this plan's lines 1 to 425 and 502 to 927; lines 426 to 501 (Foot) through a listing cut at 220 characters, read whole in round 4 and not edited by this part since. The fitter files were reviewed from rounds 1 and 2, whose reads cover both files whole, both last written 2026-10-27 18:22. Findings, all fixed in one change:

1. Round 4's change left "The buttock windows therefore reach down" after the bullet on dropped nodes, so "therefore" pointed at the wrong bullet. It now cites the window rule.

### Trunk, round 7

01:04:43 to 01:07:01 +09:00, 2026-10-28. A full round. Read whole: the Foot section (lines 426 to 501), which round 6 read cut; the Trunk section's Reliefs, where round 6 changed a word; line 553 and the Integration round 3 record, which names line 553 as its change (the plan's hash differed at 01:04:43 and 01:05:09). The rest of the plan was read whole in round 6. The fitter files were reviewed from rounds 1 and 2, whose reads cover both files whole, both last written 2026-10-27 18:22. Findings: none.

### Integration, round 5

01:16:27 to 01:18:40 +09:00, 2026-10-28, after the main agent's answers and the owner's Orders 2 and 3 (`owner-orders.md`, read whole). Read whole: this plan's lines 1 to 527; `docs/anatomy/joint-range.md`; `AutoMovieHumanPoseChannels.ts`; `planBodySections.ts`; `AutoMovieHumanAppearance.ts` (lines 1 to 40 and 239 to 260, the rest read in round 1). Command: `node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/integration/jointNames.ts test/.shots/f1 .shots/claude-scratch/integration/joint-names.txt`, output `.shots/claude-scratch/integration/joint-names.txt`; searches of it for the spine, limb and face joint names. Not a full round: the section was changed during it. Findings, all fixed in one change:

1. Order 2: the joint centres stood on stature fractions taken as world heights (`stationAtHeight`, 0.518 S, 0.2865 S, 0.0405 S, 0.8 S) and the appearance fields on world axes and heights (0.285 S, 0.7 S, world down, world +X, vertical charts). A new subsection, "Frames, anchors and joints", gives every module a declared frame and its bind joints; the joint centres take the declared joints (the source's rig has no jaw or eye joint, so the jaw keeps its convention on the head frame and the eyes the globes); the garment, marks, landmarks, tone, face, nail, chart and head field measure in module frames; world axes remain only for gravity and cameras. Export 5 converts keys into the anchor frame; Method and every part get requests.
2. The Trunk, Hand and Foot sections now define bind-derived module frames, and the trunk's station is arc length along the bind spine axis, not height. The names table, the anchor's axes (the part's declared frame, not the first key frame with a world-forward `u`) and the joint centres' spine fractions now follow them.
3. The audit server: the main agent chose the second viewer on a free port; the plan states it and drops the request. The exporter is Integration's (main agent); the Method request keeps only the data format.
4. The joint-centres citation fix was unplanned: Documents now corrects `AutoMovieHumanJointCentres.ts`'s comment and `joint-range.md`'s stickman paragraph (`:72`) and joint rows.

### Trunk, round 8

01:23:43 to 01:28:22 +09:00, 2026-10-28, after the main agent's finding against Order 2 (`owner-orders.md`, read whole). Command: `node --max-old-space-size=3072 --experimental-transform-types --no-warnings --import ./.shots/claude-scratch/hooks.ts .shots/claude-scratch/trunk/trunkFrame.ts test/.shots/f1 .shots/claude-scratch/trunk/trunk-frame.txt`, output `.shots/claude-scratch/trunk/trunk-frame.txt`. Read whole: this plan's lines 31 to 350 (the shared method as Method has revised it, with Module frames and handles, the terminal Caps, Observation families and Strips) and the Trunk section; Integration's Frames, anchors and joints. Not read in this round: the rest of the plan and the fitter files, so this is not a full round. Findings, all fixed in one change:

1. Order 2 (main agent): the trunk was keyed in world height, with horizontal keys, u = +X, v = +Z, the neck ring and `cap.from` at world heights. It now lives in its own frame: the pelvis anchor, an axis spline through the spine joints, a rotation-minimising frame from the hip axis, keys on the axis's normal planes, the neck ring on the Neck Base course's plane, `cap.from` from the leg root loops, and the relief regions and armscye in frame coordinates. Every f1 number only illustrates.
2. The pole: the shared Caps rule now takes the terminal, the crotch saddle for the trunk. The trunk adopts it, seeded at its lowest own row, and its request asks Caps to allow a `cap.from` key plane that is no family plane.
3. Shared rules now cover the partition labels, the strips record, the gap chords of start keys and the reliefs file's shape; those requests are gone. The remaining requests name where the trunk departs from the shared text: the spline axis, keys off the family planes, admissibility tested against nearby nodes.
4. The inframammary fold's rising radius is an f1 measurement in world azimuth; it now says so.
5. The survey's Trunk subsection carries the frame's facts (`trunk-frame.txt`), and its neck paragraph no longer states the old horizontal neck ring.

### Integration, round 6

01:20:50 to 01:31:36 +09:00, 2026-10-28. Read whole: this plan's lines 1 to 651 (Goal, Shared method with its new Module frames and handles, Retirement, Trunk, Hand, Foot as they stood at the read) and the Integration section; the survey's Integration subsection (lines 503 to 583); `fitAppendage.ts`; the Foot section's Requests again at 01:29:34, since the Foot was rewriting it. `git status` showed no change under `packages/human/src`, `packages/playground/src` or `test/src` since the round 1 reads, so those reads stand. `AutoMovieHumanVermilionCalibration.ts` was read at lines 1 to 40 with a search of its `address`, `chain` and `closed` lines, not whole: its plan row changes only `chain`. Not a full round: the section was changed during it. Findings, all fixed in one change:

1. The shared method now defines the anchor as the joint's bind frame, while this section had made the part's joint-centre frame the anchor (the Foot's request names the conflict). The anchor is now the shared one, and the part frames become three named axes per module (along, front, lateral) stored in the anchor frame, which the consumers read; Export 5, the merged calibration, the Method request and the parts' request follow.
2. Consumers and the defects table still said "anchor frame" where the named axes are meant; the garment's height bins said "up axis", now the trunk station.
3. Export 1 did not drop the trunk fit's `regions` and `radius` (Trunk request); Export 6 did not name `fitHand.ts`, `fitFoot.ts` and the trunk fitters (Hand request).
4. The joint centres need joints no part was asked to declare: the parts' request now gives the one-module rule and the joints to declare.
5. Documents did not add `AutoMovieHumanNail` to the survey's Couplings (Hand and Foot requests).
6. The survey's needs column still asked for a trunk ring "at the shoulder height", a knee at an axis height and a trunk that "keeps" its 0.7 stature split; it now states them as the facts they are. Its Module data format paragraph omitted the anchor; a chain's station was "along its bone", now its axis; the neck ring's 1469.10 mm height left it (round 5's change).

### Trunk, round 9

01:30:16 to 01:34:30 +09:00, 2026-10-28. Begun as a full round; it read this plan's lines 1 to 199 and stopped there to align the Trunk section with the shared method Method had revised meanwhile, so it is not a full round. Findings, all fixed in one change:

1. The shared method now allows a part's own axis curve (Module frames and handles), keys at admissible stations off the observed planes with the end-plane and start-loop test (Keys and control counts), start keys moved into a key's plane (`HumanModuleKeys.ts`), and a `cap.from` plane observed on its own to seed the terminal (Caps, Observation families). The trunk's four Method requests are therefore gone, and its bullets point at those rules; the terminal's seed is the `cap.from` plane's own loop, not the lowest own row.
2. The Representation rule starts the in-plane axes at the module's first key with u the module's front axis; the frame bullet now builds the named axes at the pelvis from the joints and starts the key frames by that rule.

### Trunk, round 10

01:35:34 to 01:38:16 +09:00, 2026-10-28. Read whole: this plan's lines 1 to 810, every section. Read in part: the Self-review records added since Trunk round 7 (the shared method's rounds 11 to 14, Foot 9 to 11, Hand 4 to 11, Integration 5); the older records were read in earlier Trunk rounds. So this is not a full round. The fitter files were reviewed from this session's rounds 1 and 2, whose reads cover `fitTrunkBase.ts` and `fitTrunkReliefs.ts` whole; both were last written 2026-10-27 18:22 (listed at the round's end). Findings, all fixed in one change:

1. The declared joints named `thigh_<s>`, the legs' anchors, and `neck_02`, beyond the neck ring, while the shared rule declares each joint in one module only and Integration asks the Trunk for its axis joints and `clavicle_<s>`. The trunk now declares `pelvis`, `spine_01` to `spine_05`, `neck_01` and `clavicle_<s>`.
2. The fitter's additions still seeded the terminal at the lowest own row; the `cap.from` plane now goes to Method's terminal observation and the pole is read from its record.
3. The Foot's partition leaves the leg planes proximal of the ankle to the Leg's and the Trunk's partitions, but the Trunk's table said nothing of the arm and leg families' joined planes before their roots. A row now gives them none of the trunk's, since the trunk rows observe that skin.

### Integration, round 7

01:34:03 to 01:38:20 +09:00, 2026-10-28. Read whole: this plan's lines 1 to 666 (Goal, Shared method with its revised Representation, Module frames and handles, Caps, Module data format, Generator evaluation and Files; Retirement; Trunk; Hand; Foot) and the Integration section to its Requests; `.agents/skills/human/verification.md` and `screenshot.md`; `AutoMovieHumanVermilionCalibration.ts`; `packages/playground/src/human-parameters/f1.ts` lines 1 to 40 (the `height` control the export reads); `IAutoMovieHumanBodyRegion.ts` lines 40 to 70 and the `eyes` and `apertures` lines of `AutoMovieHumanBodyRegions.ts` (search). Not a full round: the section was changed during it. Findings, all fixed in one change:

1. The shared method now holds the named axes, the declared joints and `compose` carrying them onto the loft chains; this section restated them and its Method request asked for them. The section now refers to the shared text, and the Method request keeps only what is missing: eyes and openings without `base` have no field naming the chain whose anchor they hang from.
2. The lip boundary and the eyes were said to live in the head anchor frame with no rule placing them: `merge` places eyes and openings by their chain's anchor (Method), `AutoMovieHuman.generate` places the lip boundary by its `chain`'s anchor; the Vermilion row and the Files entry, which said "`chain` only", follow.
3. The Trunk's fit writes its keys in the anchor's coordinates while the Hand's and Foot's fits write them in the world: Export 5 now copies or converts by the fit's record.
4. The Trunk declares `thigh_<s>`, which anchors the leg, and nobody declares `clavicle_<s>`: requests to the Trunk, Head, Arm and Leg replace the single parts request.
5. The Trunk asked that the names table's axis be the spline through the spine joints; the Hand makes palmar minus the palm's front axis: the names table and the landmarks row follow.
6. `samples` is computed on the composed chains, so Export 3 now points to item 4's merge.

### Integration, round 8

01:39:25 to 01:43:04 +09:00, 2026-10-28, after the main agent's note that Method finished the shared sections. Read whole: this plan's lines 1 to 662 (Goal, Shared method, Retirement, Trunk, Hand, Foot) and the Integration section. The Self-review records of other parts were not read. Not a full round: the section was changed during it. The export already writes the anchor, named axes, declared joints and local values (Export 5) and the consumers already read named axes and declared joints (round 7). Findings, fixed in one change:

1. The Trunk now declares `clavicle_<s>` and leaves `thigh_<s>` to the legs and `neck_02` to the Head: the Trunk request is gone, the Head's joints are `neck_02` and `head`, and the two Head and two Arm and Leg requests are merged.
2. The shared named axes define no front for a limb, while the elbow's posterior side and the knee band read one: the Arm and Leg request asks for it, and the SkinTone row says which axis and joint each rule reads.

### Trunk, round 11

01:39:38 to 01:43:48 +09:00, 2026-10-28. Read whole: this plan's lines 1 to 810, every section; the Integration round 7 record. The other Self-review records were read in earlier rounds, and the fitter files were reviewed from rounds 1 and 2 (unchanged since 2026-10-27 18:22), so this is not a full round. Findings, all fixed in one change:

1. Integration's Export 5 copies a fit's keys when its record says they are in the anchor's coordinates; the Trunk's outputs did not say the record states it. They now do.
2. The Integration request repeated what Integration's names table now says of the trunk's axis. It now keeps only the chains `trunk` covers.

### Trunk, round 12

01:45:17 to 01:48:16 +09:00, 2026-10-28. Begun as a full round. Read whole: `fitTrunkBase.ts` and `fitTrunkReliefs.ts` (numbered listings, both last written 2026-10-27 18:22); this plan's lines 1 to 465 and the Self-review records, lines 811 to 1405; lines 465 to 810 (Hand, Foot, Integration) were read in round 11, not in this round. The round found the items below, so it is not a full round. Findings, all fixed in one change:

1. The reliefs named their sides by world +Z. The `_l` side is now that of the skeleton's `_l` joints, toward which the lateral axis points.
2. The fitter changes left the starting chain of horizontal keys with its `cap` (`fitTrunkBase.ts:198`-`:208`) in neither Keeps, Replaces nor Deletes. Replaces now gives it to the start keys and cap keys of `HumanModuleKeys.ts`.

### Integration, round 9

01:43:43 to 01:47:12 +09:00, 2026-10-28. Begun as a full round. Read whole: this plan's lines 1 to 365 (Goal, Shared method, Retirement), the Foot section's Module frames and Foot base (its lines changed since round 8), every line of the Trunk, Hand and Foot sections that names Integration (a search over lines 366 to 663, after a hash of those lines differed from round 8's read), the Integration section, and every Self-review record (lines 811 to 1381). The round found the items below, so it is not a full round. Findings, all fixed in one change:

1. The Foot now gives a declared joint a station only inside its module's station range, so `ball_<s>` and a toe's `_01` carry points only, while the joint centres' segment radius read the girth at the joints' stations. It now takes the station midway between the feet of the two joints' points on the chain's axis.
2. The Arm and Leg request said the knee band reads the front axis; it reads the leg's along axis about `calf_<s>`. It now names the elbow alone.
3. Round 4's record called itself a full round though it did not reread the records; a correction under it says so.

### Trunk, round 13

01:48:24 to 01:51:32 +09:00, 2026-10-28. Begun as a full round on a copy of the plan taken at its start (`trunk-round13-start.md` in the session's scratch directory, 1422 lines). Read whole: its lines 1 to 812, every section. Its Self-review records were read in round 12, and the fitter files were read whole in round 12 (unchanged since 2026-10-27 18:22). The round found the items below, so it is not a full round. Findings, all fixed in one change:

1. The armscye paragraph said one horizontal section per station cannot hold the axillary corner, but the trunk's keys lie on the axis's normal planes. It now says one section per station.
2. Round 12's record claimed a whole read of lines 1 to 810; it read lines 1 to 465, the rest in round 11. The record now says so.

### Trunk, round 14

01:53:00 to 01:55:14 +09:00, 2026-10-28. Begun as a full round on a copy taken at its start (`trunk-round14-start.md` in the session's scratch directory, 1441 lines): compared by `diff` with round 13's copy, and every changed line read whole (the Trunk's own round 13 change; the Foot's declared joints, precondition and Method request; Integration's Documents and Files; the Foot's rounds 17 and 18 and the Trunk's records). The Trunk section was then reread for rules that hold only on f1, as the Foot's round 18 found in its own. The round found the items below, so it is not a full round. Findings, all fixed in one change:

1. `cap.from` comes from the legs' `-root-v3.json` loops, so the trunk's terminal seed cannot be named before those exist (the Hand and the Foot record the same for theirs). Bottom end now orders the trunk's terminal after the legs' roots within Retirement step 1.
2. The declared joints were "those on the trunk's side of its ends", a list that holds on f1 only. The list is now declared by name, each joint carrying its station only where its foot on the axis lies between `cap.from` and the neck ring, with f1's `neck_01` and `neck_02` as illustrations.
3. Two f1 numbers stood without "on f1": the 144 spans of the N bullet and the arm root loop's 1.68 / 1.79 mm in the Arm request. Both are now labelled.

### Integration, round 10

01:48:23 to 01:50:42 +09:00, 2026-10-28. Begun as a full round on a copy of the plan taken at its start (in this subagent's scratch directory, deleted after the round). Read whole: that copy's lines 1 to 1404 (every section and every Self-review record); the survey's Integration subsection; `IAutoMovieHumanHermiteCurve.ts`; `IAutoMovieHumanBodyCalibration.ts`'s `IEye` (search). `git status` showed no change under `packages/human/src`, `packages/playground/src`, `test/src` or `.agents`, so the earlier whole reads of the code files stand. One finding stopped it, so it is not a full round:

1. The lip boundary's spans move into its chain's anchor coordinates, but `IAutoMovieHumanHermiteCurve`'s JSDoc says "in the registered millimetre frame", and neither Files nor Documents named that file. Both now do.

This record was first appended at 01:51:39 and was lost to a concurrent write of the plan; it is written again here.

### Integration, round 11

01:51:39 to 01:56:21 +09:00, 2026-10-28. A full round on a copy of the plan taken at its start (`plan-r11.md` in this subagent's scratch directory, 1434 lines, deleted after the round). Read whole: that copy's lines 1 to 1435, every section and every Self-review record, the Shared method, Retirement, Trunk, Hand, Foot and Integration sections included. The survey's Integration subsection was read whole in round 10 and is unchanged since (no edit to it after round 6). `git status` at 01:56:21 showed no change under `packages/human/src`, `packages/playground/src`, `test/src` or `.agents`, so the whole reads of the code files the section names (round 1, and rounds 5 to 7 and 10 for the files added since) stand. Findings: none.
