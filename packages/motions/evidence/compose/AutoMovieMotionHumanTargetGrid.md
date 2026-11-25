# src/compose/AutoMovieMotionHumanTargetGrid.ts#AutoMovieMotionHumanTargetGrid.height

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result's unit.

## @evidence contracts/development/implementation.md#principled-implementation

Each name is a joint height of the body's measure over its stature; the knee is the hip less the thigh, and `overhead` the shoulder plus `OVERHEAD` arms.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exhaustive switch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No height is a typed share of the stature; the one number is the named `OVERHEAD`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTargetGrid.ts#AutoMovieMotionHumanTargetGrid.place

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the mirroring, the result's consumers and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Names read the body's measure and the share tables; a nudge in arm lengths is converted to each axis's own unit (statures up, half shoulder widths out); a between interpolates each numeric field linearly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per rung over two private helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped: a nudge past its bound throws and names the neighbouring name, and a between of two facings throws, since a facing cannot be interpolated.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `height`, `LATERALS`, `DISTANCES` and `AutoMovieMotionHumanTarget.DEFAULTS`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanTargetGrid.ts#AutoMovieMotionHumanTargetGrid.nearest

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, that the root's height is not read, and the tie rule.

## @evidence contracts/development/implementation.md#principled-implementation

The inverse of `place` followed by `fallback`: the point is taken into the performer's floor frame and each axis takes the name whose resolved length is nearest, so a captured pose is checked against a law's names through a path that does not run the resolver forward.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame transform and one nearest-name search per axis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A point far from every name still returns the nearest names; the caller reports the distance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the eighteen names.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanFrame.local`, `height` and the share tables.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
