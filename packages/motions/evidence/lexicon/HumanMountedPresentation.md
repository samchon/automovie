# src/lexicon/HumanMountedPresentation.ts#HumanMountedPresentation.IRange

## @evidence contracts/development/common.md#meaningful-documentation

States each side's unit and sign.

## @evidence contracts/development/design.md#principled-representation

Two degrees, the left positive and the right negative.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `range` and read by `turn`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanMountedPresentation.ts#HumanMountedPresentation.range

## @evidence contracts/development/common.md#meaningful-documentation

States the sides and the failure.

## @evidence contracts/development/implementation.md#principled-implementation

A turn of T twists the chest by CHEST times T and the spine by the rest, so the largest turn is the lesser of each joint's limit over its share.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bound per side from two joint limits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A table without a trunk twist fails rather than assuming one.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read of a constant table.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPresentation.ts#HumanMountedPresentation.bearing

## @evidence contracts/development/common.md#meaningful-documentation

States the convention and the range.

## @evidence contracts/development/implementation.md#principled-implementation

The floor direction to the target, read against the heading's forward and its left.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One arctangent.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPresentation.ts#HumanMountedPresentation.turn

## @evidence contracts/development/common.md#meaningful-documentation

States the result, its sign, both sides and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The arms present within `TURN` of the chest's facing on their own side, so the trunk turns by whatever of the bearing exceeds it there; an arm does not present across the chest, so for a target on the other side the trunk turns toward it by its whole bearing up to its range, and only the rest is the arms'; with the turn already held, the sum stays within the range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One side test, one turn and one bound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A target beyond the reach is refused, never presented to at a clamped bearing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanMountedPresentation.ts#HumanMountedPresentation.IStation

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The trunk's turn and three seat-frame vectors.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `station`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HumanMountedPresentation.ts#HumanMountedPresentation.station

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, each step and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The bearing off the seat's forward gives the trunk's turn; the shoulder sits half the shoulders' width to its side at the shoulders' height over the hips, turned with the trunk; the hand lies on the shoulder's line to the target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Bearing, turn, shoulder, line.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A target past the trunk's turn is refused by `turn`, never clamped; a target at the shoulder has no line and fails.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
