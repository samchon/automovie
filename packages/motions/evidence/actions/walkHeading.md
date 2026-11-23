# src/actions/walkHeading.ts#walkHeading.step

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and how it is read.

## @evidence contracts/development/implementation.md#principled-implementation

Linear between the cited amplitudes, the nearest beyond them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table walk.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is extrapolated past the measured amplitudes.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Three rows.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkHeading.ts#walkHeading.closing

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the rule.

## @evidence contracts/development/implementation.md#principled-implementation

The turn over the step turn, rounded up, never under the ordinary ramp.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One division and one bound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An arrival the ordinary ramp carries keeps it exactly.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkHeading.ts#walkHeading.capped

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the rule.

## @evidence contracts/development/implementation.md#principled-implementation

The asked turn clamped to the bound, its sign kept.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One clamp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A target within the bound is returned as asked.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkHeading.ts#walkHeading.opening

## @evidence contracts/development/common.md#meaningful-documentation

States what is counted, the bounds and each input.

## @evidence contracts/development/implementation.md#principled-implementation

A standing turn before gait: the feet alternate, each turning the cited yaw per swing toward the way, until both face it within the pelvis's twist; a half turn takes four footfalls and a quarter two, against 3.25 and 1.95 steps measured (Khobkhun et al. 2022).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over alternating feet.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A way within a swing's turn counts none, so such a walk sets off as before.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

At most a few footfalls.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkHeading.ts#walkHeading.about

## @evidence contracts/development/common.md#meaningful-documentation

States the bound, the order and each input.

## @evidence contracts/development/implementation.md#principled-implementation

A foot turns from its own last footprint at most the yaw a foot turns per swing in a standing turn of the walk's amplitude; the rest of the turn is left to its later footfalls.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the footfalls, one clamp each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A facing within the bound is returned as asked, so a walk that does not turn about is unchanged; the closing pair keeps the arrival's facing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One pass.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new array and retains nothing.

# src/actions/walkHeading.ts#walkHeading.uncrossed

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the crossing test and the source.

## @evidence contracts/development/implementation.md#principled-implementation

A footprint crosses when it lies on the other side of the standing foot's line, along that foot's own sideways axis, from where the swing foot starts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One test of the default lead, then the swap.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A lead whose footprint stays on its own side is kept, so a straight or gently turning walk is unchanged.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkHeading.ts#walkHeading.separated

## @evidence contracts/development/common.md#meaningful-documentation

States the crossing, the rule and each input.

## @evidence contracts/development/implementation.md#principled-implementation

The separation across the facing is read along the facing's own +X, and a shortfall from the two feet's own offsets is made up by moving this footprint toward its side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One projection and one shift.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A footprint already its offsets apart is returned as it is, so a walk facing its way is unchanged.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkHeading.ts#walkHeading.around

## @evidence contracts/development/common.md#meaningful-documentation

States the step turn, its source and each input.

## @evidence contracts/development/implementation.md#principled-implementation

The two feet's offsets laid along the new facing's own +X from the standing footprint, as `separated` reads them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One axis and one offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The separation is the feet's own offsets, the same `separated` keeps.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/walkHeading.ts#walkHeading.ISeparated

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The ankle and its offset across its facing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `separated` reads of the other foot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Written by the footstep planner as it places each footprint.

# src/actions/walkHeading.ts#walkHeading.leaned

## @evidence contracts/development/common.md#meaningful-documentation

States the bound and each input.

## @evidence contracts/development/implementation.md#principled-implementation

The angle between the foot's line and the line to its hip is held within the band the leeway subtends at the hip's distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One distance, one band and one clamp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A hip within the leeway leaves the heading as it is.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
