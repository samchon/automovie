# src/compose/courseLimbSwivelKnots.ts#courseLimbSwivelKnots.ISwivelKnot

## @evidence contracts/development/common.md#meaningful-documentation

States the members.

## @evidence contracts/development/design.md#principled-representation

The resolver's own seeds at a second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read only by `courseLimbSwivels.swivels`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No pose is kept.

# src/compose/courseLimbSwivelKnots.ts#courseLimbSwivelKnots.between

## @evidence contracts/development/common.md#meaningful-documentation

States what each limb takes and why.

## @evidence contracts/development/implementation.md#principled-implementation

The swivel is the one free coordinate of a two-bone limb on its goal; its shortest-turn interpolation between two fits on one branch moves the elbow continuously between them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One share, one pass over the earlier knot's limbs and one over the later knot's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A limb is never interpolated across a branch change.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the knots' limbs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
