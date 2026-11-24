# src/sport/kickboxing/KickboxingRing.ts#KickboxingRing

## @evidence contracts/development/common.md#meaningful-documentation

States what is read from which contact and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Each contact carried into the world by the prop's frame; the side is the distance across between opposite ropes, which bound the ring, and the posts are checked on the corners that side puts them at.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the contacts, then the square, then the posts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A prop that is no square ring is refused with its contacts, never read as one.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the prop's contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per ring.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/sport/kickboxing/KickboxingRing.ts#KickboxingRing.corner

## @evidence contracts/development/common.md#meaningful-documentation

States the margin's meaning and the units.

## @evidence contracts/development/implementation.md#principled-implementation

The corner's ring-local coordinates rotated by the ring's heading and translated to its centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A table of local corners and one frame change.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/sport/kickboxing/KickboxingRing.ts#KickboxingRing.inside

## @evidence contracts/development/common.md#meaningful-documentation

States the test, the margin and the units.

## @evidence contracts/development/implementation.md#principled-implementation

The point in ring-local coordinates against the half side less the margin on both axes, with a 1e-12 m tolerance for rounding on the boundary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame change and two comparisons.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/sport/kickboxing/KickboxingRing.ts#KickboxingRing.clamp

## @evidence contracts/development/common.md#meaningful-documentation

States the result, the margin's bound and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The nearest point of a square is the per-axis clamp of the point's ring-local coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two frame changes around one clamp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A margin leaving no area throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
