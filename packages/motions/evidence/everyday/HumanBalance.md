# src/everyday/HumanBalance.ts#HumanBalance.shift

## @evidence contracts/development/common.md#meaningful-documentation

States the balance condition, the flat feet sought before the forefoot, the cases on each, the search range in hip heights, the tolerance, the bracket and its refinement, and the nearer end when none balances.

## @evidence contracts/development/implementation.md#principled-implementation

Without a requested target, an already supported mass needs no shift. The closest directional hull point first gives the rigid translation. A planted-leg refit verifies the candidate's support and heel state. The original bracketed centre and heel searches apply where this closed candidate does not hold or the caller requests a target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading per trial (`read`), each shift read once per call, and one bracketed search per case; the balance measures live in one place.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ranges (`RANGE`, and `REACH` for a posture whose hips start away from the feet) and the tolerance (0.5 mm) are named search parameters, not tuned to a case; a body that cannot balance gets its nearest shift and the laws' stability verdicts report the remainder.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each search reads its bracket's two ends, then the bracketed root converges superlinearly where the centre's place is smooth, and bisection takes log2(range / tolerance), near 10, posture solves; each solve is one forward-kinematics pass with limb fits, read once for both measures and once per shift in the call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One genuine same-body ROM projector and exact FK workspace serve all complete current fits. At the original first mass-placement point, one genuine mass-model epoch snapshots the unchanged classic model; exact current frame scalar keys share only fixed local rotations while every ordered mass sum runs. After the first original full observation succeeds, one poseBones.prepare demand binds actual mass-profile and foot socket/outline names for later final frames. Every joint still projects and admits in order, all changed FK dependencies are checked, and each trial shares only its actual sole placement between base and heel tests.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The trial map, fixed-name FK demand, genuine ROM projector and exact FK workspace end with this solve; each foot reader ends with its synchronous trial, the classic model is borrowed lazily from the body and its operation token is released in finally on every success/failure; no dynamic context or model/result cache survives the search.

# src/everyday/HumanBalance.ts#HumanBalance.margin

## @evidence contracts/development/common.md#meaningful-documentation

States the measured quantity, its sign, the support points used and the static (zero-velocity) form of Hof's margin.

## @evidence contracts/development/implementation.md#principled-implementation

Hof et al. 2005 margin with zero velocity: the engine's segmental centre of mass to the convex hull of the feet's bearing outlines (`HumanFoot.base`), from the solved posture's bones.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Solves common centre/support geometry once and delegates only the requested hull margin to the engine, leaving directional projection and heel-state queries to consumers that need them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case: every posture uses the same bearing outlines and the engine's model.

## @evidence contracts/development/implementation.md#efficient-algorithms

One full posture solve, common mass/support placement and the hull of the two outlines' points; it no longer computes an unused heading offset or repeats sole-socket queries for heel state.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A pure query; nothing to reuse across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the body's prepared mass model during this synchronous query and retains no model or result.

# src/everyday/HumanBalance.ts#HumanBalance.centre

## @evidence contracts/development/common.md#meaningful-documentation

States actual complete posture solving, classic mass-model ownership and world-metre output, with support geometry outside this request.

## @evidence contracts/development/implementation.md#principled-implementation

Runs the ordinary complete canonical posture solver, then demands the actual profile-bearing FK frames consumed by the same classic mass model and engine placement used by support; no leg, contact or digit fit is omitted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy exact reader serves the actual complete pose solve and final profile FK, then body-owned mass placement exposes the centre-only dependency that reaction entry and bending observations need.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps original authored goals, clamping, actual limb/digit fitting and mass model; it omits unused foot-outline/socket/hull work without substituting a guessed centre or achieved target.

## @evidence contracts/development/implementation.md#efficient-algorithms

Costs one full posture solve, ordered joint admission, demanded profile/ancestor FK and linear placement over mass segments; centre-only requests allocate no unrelated bone frames or foot bearing points and run no support projection/hull query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The classic mass model and collider metadata share actual profile-name demands. A local/borrowed operation FK reader shares exact dependencies, and a genuine same-body projection loan shares only static ROM metadata through seeded's provenance gate; every current joint, fit and mass placement still evaluates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local getter ends with the synchronous query, while an optional parent retains only its own operation workspace. The returned fresh vector retains no body, pose, model, reader or support data.

# src/everyday/HumanBalance.ts#HumanBalance.extrapolated

## @evidence contracts/development/common.md#meaningful-documentation

States the extrapolation, the difference step, the pendulum length convention, the support and the sign.

## @evidence contracts/development/implementation.md#principled-implementation

Hof, Gazendam and Sinke 2005 extrapolated centre of mass: position plus velocity over sqrt(g / l) with l = 1.34 hip heights (Hof's leg length), velocity by a central difference over 1/240 s of the movement's own postures, measured to the hull of the feet's bearing outlines.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the centre at three instants and hands extrapolation and margin to the engine; the base's gathering repeats `margin`'s reading on the bones already solved for the instant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1/240 s step is a numerical choice finer than the 24 Hz film and the length is Hof's (`resolveAutoMovieCenterOfMass.pendulum`); the difference amplifies any discontinuity in the caller's posture function, which callers must keep smooth.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three posture solves per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One mass-name demand serves both neighbours and one genuine ROM projector/exact FK workspace serves all three actual full fits/display readings. Each joint still projects in order and every changed FK dependency is checked, without fitted-pose or finite-difference sample reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the body's prepared mass model for these actual three solves, retaining no model, sampled frame or result after return.

# src/everyday/HumanBalance.ts#HumanBalance.support

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned, its frame and which sockets form the support.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's segmental centre of mass and the feet's bearing outline points of the solved posture, for callers that measure margins along a direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns the raw centre and points so `along` can measure any direction without solving again.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case present.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Callers reuse its result for several directions (brace reads push and lateral margins from one observation), and may lend genuine same-operation FK/ROM metadata across repeated full fits. Current goals, joint projection, mass and support placement remain actual.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the body's prepared mass model and optional synchronous exact FK/genuine ROM metadata, returning fresh support data without retaining a reader, projector, result, model or sampled history.

# src/everyday/HumanBalance.ts#HumanBalance.along

## @evidence contracts/development/common.md#meaningful-documentation

States the measured distance, the frame (horizontal, height ignored), the direction's normalisation and the sign outside the hull.

## @evidence contracts/development/implementation.md#principled-implementation

Casts the horizontal point along the direction against each edge of the engine's convex hull of the support points and takes the farthest crossing, the exit; inside-ness comes from the engine's `pointInHull`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the hull's edges; the hull and containment come from the engine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 1e-12 tolerances guard parallel edges and endpoint hits numerically; a hull of fewer than three points counts as outside, and a zero direction is not guarded (callers pass unit headings).

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n log n) for the hull of n support points (two foot outlines in practice) plus O(n) for its edges.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A pure function; nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the hull per call and retains nothing.

# src/everyday/HumanBalance.ts#HumanBalance.offset

## @evidence contracts/development/common.md#meaningful-documentation

States the quantity, the reference (the bearing base's middle along the heading), the axis (the posture's heading) and the sign.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's centre of mass minus the middle of the base that bears after the leg fit, both projected on the heading from the posture's yaw: the static balance error `shift` drives to zero, which a heel-off moves with the base.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One solved centre/support preparation feeds the same heading projection shared by shift's complete reading; offset requests do not compute hull margins or heel state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case present.

## @evidence contracts/development/implementation.md#efficient-algorithms

One full posture solve and linear projection over actual bearing points; the unused support-hull margin and heel-state socket queries are omitted.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A pure query; nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the body's prepared mass model during one synchronous solve and retains no duplicate model or output.
