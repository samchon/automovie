# src/lexicon/HumanCarriedCouplingFit.ts#HumanCarriedCouplingFit.IRead

## @evidence contracts/development/common.md#meaningful-documentation

States which frames the bone maps hold and why the fit and maps belong together.

## @evidence contracts/development/design.md#principled-representation

A rigid placement plus the untranslated bones it maps between. The placement carries the borne key pose onto the bearer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The coupling consumes both existing maps for anchor, contact and mass placement; `fit` exposes only the placement to callers that need no maps.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No re-fit or near-match can stand in for the final winning registration.

# src/lexicon/HumanCarriedCouplingFit.ts#HumanCarriedCouplingFit.fit

## @evidence contracts/development/common.md#meaningful-documentation

States the reach premise, optional nearer grips and placement frame.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same fixed-contact registration and reach test as `read`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call to the solver, then reads its placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Delegates the complete check to `read` with every supplied input.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The shared solver owns the work; the caller keeps only the placement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses `read` for both the reachable key and the fallback.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No bone map leaves this wrapper.

# src/lexicon/HumanCarriedCouplingFit.ts#HumanCarriedCouplingFit.read

## @evidence contracts/development/common.md#meaningful-documentation

States what is fitted, what is held exactly, the inputs and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The stance and the legs: the least range-weighted change from upright and the carry's own subject to each held region's gap past its arm being none, by the l1 exact penalty's trust-region sequential convex optimisation of trajopt (`HumanSequentialConvex`, the port of `sco::BasicTrustRegionSQP::optimize`, github.com/joschu/trajopt src/sco/optimizers.cpp at commit 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause, Copyright (c) 2013, John Schulman) at sco's defaults, its constraints, the gaps in metres as sco's are, met to sco's `cnt_tolerance_` 1e-4 m, which the admission reads too; each model the quadratic program of the change with the gaps linearised by central differences, one-sided at a range's end, solved by the operator splitting in the box scaled to each coordinate's span and intersected with its range. A program the splitting leaves unsolved ends the fit failed, as sco's does. The turn about the resting point is Wahba's problem over the hold directions, solved by Horn's absolute orientation (`fitRigidMeshTransform`) on each direction and its mirror about the resting point, so both clouds' centroids are the resting points and only the turn is fitted. With fewer than two holds the key pose's own axes join the directions, so its heading is kept where no hold decides it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the authored key first; prepare the trust-region search only if the key violates a reach or angle constraint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The resting contact is kept exact and every angle stays within its range: the legs within the range table, the trunk within full forward bending, the lowering within a squat; a hold still beyond its arm is refused, never stretched.

## @evidence contracts/development/implementation.md#efficient-algorithms

A reachable key takes one registration and one reach check per grip. Fallback linearises at most six coordinates using two points each, and reuses the current stance for leg derivatives and the current gaps at each one-sided endpoint; at most 5 coefficients × 50 convexifications, each prepared once and solved once per box tried.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fallback starts with the measured key and returns its winning reading. The curvature is built once per fit; one linearisation's slopes and its prepared program serve every box of its iteration, each solve starting from the last.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The fit holds one curvature and the current linearisation until it returns or throws. Only the winning placement and two maps leave the fit.
