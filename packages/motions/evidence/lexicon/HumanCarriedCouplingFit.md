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

The stance and the legs: the least range-weighted change from upright and the carry's own subject to each held region's gap past its arm being none, by the l1 exact penalty's trust-region sequential convex optimisation with a steered penalty (Nocedal and Wright's Algorithm 4.1 schedule), each model the quadratic program of the change with the gaps linearised by central differences, one-sided at a range's end; it settles at the square root of machine epsilon of the arm. The turn about the resting point is Wahba's problem over the hold directions, solved by Horn's absolute orientation (`fitRigidMeshTransform`) on each direction and its mirror about the resting point, so both clouds' centroids are the resting points and only the turn is fitted. With fewer than two holds the key pose's own axes join the directions, so its heading is kept where no hold decides it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the authored key first; prepare the trust-region search only if the key violates a reach or angle constraint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The resting contact is kept exact and every angle stays within its range: the legs within the range table, the trunk within full forward bending, the lowering within a squat; a hold still beyond its arm is refused, never stretched.

## @evidence contracts/development/implementation.md#efficient-algorithms

A reachable key takes one registration and one reach check per grip. Fallback linearises at most five angles using two points each, and reuses the current stance for leg derivatives and the current gaps at each one-sided endpoint. Penalty changes reprice the model without new geometry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fallback starts with the measured key and returns its winning reading. The curvature is built once per objective flag and costs from one linearisation share slopes and solver preparation across penalties.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The fit holds two curvatures and the current linearisation until it returns or throws. Only the winning placement and two maps leave the fit.
