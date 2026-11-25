# src/compose/AutoMovieMotionHumanLean.ts#AutoMovieMotionHumanLean.tilt

## @evidence contracts/development/common.md#meaningful-documentation

States what is tilted, that no balance shift is made and when that is right.

## @evidence contracts/development/implementation.md#principled-implementation

The pitch and the roll are added to the posture's own, so a tilt composes with a base that already leans.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two sums.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The root is not moved; a lean deep enough to need the hips back is `bow`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its props only and holds no per-second state.

# src/compose/AutoMovieMotionHumanLean.ts#AutoMovieMotionHumanLean.pivot

## @evidence contracts/development/common.md#meaningful-documentation

States what is added, what stays in place and why the root is not the pivot.

## @evidence contracts/development/implementation.md#principled-implementation

The hips' place is the root plus the rotated rest offset of the hips; the new root is that place less the offset rotated by the tilted heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two rotated offsets and one subtraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The hips' place is read with the posture's own pitch and roll, so a posture that already leans keeps its hips too.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `humanPostureHeading`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanLean.ts#AutoMovieMotionHumanLean.about

## @evidence contracts/development/common.md#meaningful-documentation

States what is added, what stays in place and the frame and unit of each input.

## @evidence contracts/development/implementation.md#principled-implementation

The point is read in the posture's root frame by the inverse of its heading; the new root is the point less that offset turned by the tilted heading, a rotation of the whole body about the point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One inverse-rotated offset, one rotated offset and one subtraction, as `pivot` does about the hips.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The offset is read from the posture's own root and heading, so a posture that already leans, bends or sways keeps its root where no tilt is added.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `humanPostureHeading`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanLean.ts#AutoMovieMotionHumanLean.sway

## @evidence contracts/development/common.md#meaningful-documentation

States the three things done to the body, in order, and when the primitive fits.

## @evidence contracts/development/implementation.md#principled-implementation

The hips are the pivot of a standing lean and a planted leg has a fixed length, so the hips' height follows from where the feet are once the hips have moved.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One `pivot`, one floor-frame translation and one `lowerHumanPosture`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The travel's height is discarded and the written posture keeps its own limbs: the legs given are read for the height only.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses pivot/floor transforms and lower's original planted-leg rule. The actual write borrows its host FK source only through the current two-hip observation; declared inputs retain root/trunk and both leg goals while independent head/arm writers can be omitted from a demanded prefix.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its props only and holds no per-second state.

# src/compose/AutoMovieMotionHumanLean.ts#AutoMovieMotionHumanLean.tip

## @evidence contracts/development/common.md#meaningful-documentation

States each input's unit and direction.

## @evidence contracts/development/implementation.md#principled-implementation

The hip joint is held at its place moved back by the shift while the pitch is added, and the root is the point that puts the rotated hip offset there: a rotation about the hips, not about the root.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One target point, one rotated offset and one subtraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The hips' place is read from the posture's own root and heading before the pitch is added.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanFrame.point` and `humanPostureHeading`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanLean.ts#AutoMovieMotionHumanLean.bow

## @evidence contracts/development/common.md#meaningful-documentation

States the pitch, where the hip shift comes from, how it scales between and when it throws.

## @evidence contracts/development/implementation.md#principled-implementation

The trunk's weight acts ahead of the hips by its length times the pitch's sine, so the shift that balances the peak scales to any smaller pitch by the ratio of sines.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One balance solution at plan time, then one `tip` per written second.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A peak of 0 or less throws before the division by its sine; the weight is clamped to [0, 1].

## @evidence contracts/development/implementation.md#efficient-algorithms

The balance is solved once, not at every second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanBalance.shift` and `tip`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive keeps one number beside its props.
