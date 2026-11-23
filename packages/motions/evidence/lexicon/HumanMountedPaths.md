# src/lexicon/HumanMountedPaths.ts#HumanMountedPaths.hips

## @evidence contracts/development/common.md#meaningful-documentation

States the point.

## @evidence contracts/development/implementation.md#principled-implementation

The two hip joints the root and attitude place (`hipJoints`), averaged.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One call.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPaths.ts#HumanMountedPaths.pivot

## @evidence contracts/development/common.md#meaningful-documentation

States when a pivot exists.

## @evidence contracts/development/implementation.md#principled-implementation

Both legs planted in both keys with their ankles within a millimetre.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One check per leg.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPaths.ts#HumanMountedPaths.swing

## @evidence contracts/development/common.md#meaningful-documentation

States both ways and what the swing preserves.

## @evidence contracts/development/implementation.md#principled-implementation

Polar interpolation about the pivot: the unit directions blended and renormalised, the radii blended linearly.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Opposite directions fall back to the straight way.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPaths.ts#HumanMountedPaths.heels

## @evidence contracts/development/common.md#meaningful-documentation

States which legs are turned.

## @evidence contracts/development/implementation.md#principled-implementation

The posture's own hip joints (`hipJoints`) and each planted leg through `heelMountedFoot`.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One pass over two legs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A leg goal attached to a bone or not planted is left as it is.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read per sample.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPaths.ts#HumanMountedPaths.unarmed

## @evidence contracts/development/common.md#meaningful-documentation

States what is dropped and why.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

Two deletions.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One copy.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPaths.ts#HumanMountedPaths.grips

## @evidence contracts/development/common.md#meaningful-documentation

States the points and their frame.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

One inverse transform per hand.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One loop over two hands.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPaths.ts#HumanMountedPaths.names

## @evidence contracts/development/common.md#meaningful-documentation

States the test.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

One read.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPaths.ts#HumanMountedPaths.entered

## @evidence contracts/development/common.md#meaningful-documentation

States when a foot hangs.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

One choice per leg.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One loop over two legs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A figure that names no stirrup keeps the entry's feet as they were.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPaths.ts#HumanMountedPaths.window

## @evidence contracts/development/common.md#meaningful-documentation

States each part's window.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A table read.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One choice per part.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new window.

# src/lexicon/HumanMountedPaths.ts#HumanMountedPaths.slack

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured, over which spans and in which direction.

## @evidence contracts/development/implementation.md#principled-implementation

The contact's height against `HumanMountedStride.level`'s average, sampled `2 SAMPLES` times a stride over each out-of-saddle figure's transfer and hold.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One loop per figure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Seated figures are not read; a performance with no stride has no slack.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sixteen samples a stride, each `SAMPLES` plus one carrier readings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPaths.ts#HumanMountedPaths.rested

## @evidence contracts/development/common.md#meaningful-documentation

States when a foot pivots and about what.

## @evidence contracts/development/implementation.md#principled-implementation

A planted goal's contact is its sole socket in the foot's frame, so the ball is the ankle plus the foot's rotation of it; equal balls at both ends mean the foot stays on its rest.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bound is the campaign's contact bound, not a tuned one.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPaths.ts#HumanMountedPaths.arcs

## @evidence contracts/development/common.md#meaningful-documentation

States when a foot swings and through which point.

## @evidence contracts/development/implementation.md#principled-implementation

Four collider distance queries along the straight way against the shank's radius; the waypoint is the middle of a quadratic arc the law adds to the blended ankle.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One loop per figure and side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A foot kept on its stirrup never leaves it.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most four collider queries per foot per figure.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one small record per figure.
