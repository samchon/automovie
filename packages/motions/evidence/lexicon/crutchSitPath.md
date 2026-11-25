# src/lexicon/crutchSitPath.ts#crutchSitPath.ICrutch

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The two contacts and the distance between them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the paths read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Read from the crutch's own contacts.

# src/lexicon/crutchSitPath.ts#crutchSitPath.crutch

## @evidence contracts/development/common.md#meaningful-documentation

States the input, result and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The two contacts' translations and their distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two lookups and one distance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing contact is refused.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per crutch.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/crutchSitPath.ts#crutchSitPath.slid

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, frames and result.

## @evidence contracts/development/implementation.md#principled-implementation

The rotation turning the shaft's `+Y` onto the tip-to-point direction and its `+Z` toward the heading (`HumanHand.align`), placed so the tip stays on its point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation and one placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact rigid geometry.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/crutchSitPath.ts#crutchSitPath.carried

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the lift and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Position and rotation on one minimum-jerk share, the lift a minimum-jerk bump.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The lift is the crutch walk's.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/crutchSitPath.ts#crutchSitPath.socket

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and result.

## @evidence contracts/development/implementation.md#principled-implementation

The grip socket read by `HumanHand.frame` on the pose's bones.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Read on the displayed entry pose.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One forward kinematics of the hand's chain.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per hand.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/crutchSitPath.ts#crutchSitPath.grasped

## @evidence contracts/development/common.md#meaningful-documentation

States the grasp, the frames and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The inverse of the hand's rigid frame applied to the crutch's: the offset `AutoMovieMotionHumanHeld` keeps while the grip holds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation and one inverse transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The socket lies on the crutch's own grip.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per crutch.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/crutchSitPath.ts#crutchSitPath.held

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, frames and result.

## @evidence contracts/development/implementation.md#principled-implementation

The grip frame is the grip socket's point with the hand bone's rotation, as `AutoMovieMotionHumanHeld` reads a held prop.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose read and one inverse transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Read on the displayed entry pose.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One forward kinematics of the hand's chain.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per crutch.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
