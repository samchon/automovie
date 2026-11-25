# src/law/HumanPhysics.ts#HumanPhysics.supportOffset

## @evidence contracts/development/common.md#meaningful-documentation

States the world-space direction, zero case and signed distance in metres.

## @evidence contracts/development/implementation.md#principled-implementation

Intersects the line through the mass centre with the convex hull's inward half planes and clamps zero to the common interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass narrows the interval after the engine orders the support hull.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An empty reachable interval returns null, and a point inside is never pulled towards the middle.

## @evidence contracts/development/implementation.md#efficient-algorithms

The hull costs O(P log P); the supported travel interval then costs one edge pass with constant scalar storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single geometric projection with no time or pose samples.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No geometry is retained after the query.

# src/law/HumanPhysics.ts#HumanPhysics.shift

## @evidence contracts/development/common.md#meaningful-documentation

States the resolution and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Author fields precede recommendations, followed by the intrinsic weight and blend defaults.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One presence test, then resolve and admit the terms once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing part or bound is refused by its own field name.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record; retains nothing.

# src/law/HumanPhysics.ts#HumanPhysics.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the two clocks and per-plan lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Event shares become seconds using the plan duration; a foreign cue's film second loses the action start to put both kinds on the same clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve one option and two endpoints, or return early for a zero weight.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reversed bounds are refused by field name, and an absent external resolver cannot fabricate a time.

## @evidence contracts/development/implementation.md#efficient-algorithms

Resolves names only on request and at most twice per plan, skipping event resolution entirely for a zero weight.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All actual posture samples borrow the same admitted endpoints.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns numeric bounds and blend lengths without retaining the action or its resolver.

# src/law/HumanPhysics.ts#HumanPhysics.weightAt

## @evidence contracts/development/common.md#meaningful-documentation

States the action clock, the profile and the overlap rule.

## @evidence contracts/development/implementation.md#principled-implementation

The Flash–Hogan quintic gives a smooth rise or fall. Dividing the finite window length by the sum of both ramps gives the common shortening factor when they would overlap.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Rejects seconds outside the window, then evaluates an active edge or returns full weight.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both transition lengths come from the window, with no fixed extra timing or pose work.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar arithmetic and at most one easing evaluation, only inside the window.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows already-resolved bounds from the plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains nothing.

# src/law/HumanPhysics.ts#HumanPhysics.instant

## @evidence contracts/development/common.md#meaningful-documentation

States the mapping and its default.

## @evidence contracts/development/implementation.md#principled-implementation

The same representation the layers and cue tracks resolve, so one resolver reads every instant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No share of a duration names an instant.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record; retains nothing.

# src/law/HumanPhysics.ts#HumanPhysics.weight

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The shift's own weight between its event-named bounds, resolved by the performance's one instant resolver.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two instants, one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No ramp of its own: the shift's terms alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two instant resolutions a call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/law/HumanPhysics.ts#HumanPhysics.judged

## @evidence contracts/development/common.md#meaningful-documentation

States the three sources and their order.

## @evidence contracts/development/implementation.md#principled-implementation

Judgement follows the explicit override, the law's physical phase or a balance with positive actual weight.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the explicit override, physical declaration, or prepared balance in that order. A cut limits both physical and requested phases to the placed lifetime.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing else turns the check on; a planted, posed action is not judged.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/law/HumanPhysics.ts#HumanPhysics.intervals

## @evidence contracts/development/common.md#meaningful-documentation

States the film clock and the separate exact sample predicate.

## @evidence contracts/development/implementation.md#principled-implementation

Intersects each local phase with the span's placed lifetime.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Return the whole span if declared, otherwise take up to two bounded ranges.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains both phases even if their bounds do not overlap.

## @evidence contracts/development/implementation.md#efficient-algorithms

Produces at most two intervals irrespective of film duration.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Uses the plan's existing numeric bounds.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns new interval values.
