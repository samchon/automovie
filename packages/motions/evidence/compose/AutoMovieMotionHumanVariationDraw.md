# src/compose/AutoMovieMotionHumanVariationDraw.ts#AutoMovieMotionHumanVariationDraw.uniforms

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the count's range and the result's range.

## @evidence contracts/development/implementation.md#principled-implementation

The additive recurrence of Roberts 2018 with a seeded rotation (Cranley and Patterson 1976): component `c` of repeat `n` is the fraction of `stream.float(c) + n ALPHA[count][c]`, so repeats fill the range evenly and two slots never move together.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression per component.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The stream is read at the fixed indices 0 to `count - 1` whatever the repeat, so a slot's draws never depend on another slot or on the order of calls.

## @evidence contracts/development/implementation.md#efficient-algorithms

One stream read per component.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; the laws resolve each slot once at plan time.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanVariationDraw.ts#AutoMovieMotionHumanVariationDraw.normals

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result's range.

## @evidence contracts/development/implementation.md#principled-implementation

Each uniform is mapped into the central mass of the normal between the two truncation points and read through the normal's quantile function, so one uniform gives one component and the sequence's spacing survives, which a Box-Muller pair does not keep.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map over `uniforms`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped: a truncated quantile has no pile-up at its ends.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `uniforms` and one quantile function.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per component.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/compose/AutoMovieMotionHumanVariationDraw.ts#AutoMovieMotionHumanVariationDraw.disc

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the unit and the bound of the result.

## @evidence contracts/development/implementation.md#principled-implementation

The radius is the quantile of the radial distribution cut at `TRUNCATE` and the angle is uniform, so the bound is a distance from the origin and not a square.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One radius, one angle and their two coordinates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is rejected or clamped: the cut is taken in the quantile, so every draw gives one point.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `uniforms`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanVariationDraw.ts#AutoMovieMotionHumanVariationDraw.cell

## @evidence contracts/development/common.md#meaningful-documentation

States what a cell and its edge are, the open side's rule, the unit and the result with no room.

## @evidence contracts/development/implementation.md#principled-implementation

A varied value keeps its name while it is nearer to that name than to any other, which is the cell between the two midpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The nearest name, its two edges and one distance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A value past its cell's edge gets 0 and never a negative bound; an axis with one name has no edge and gets 0.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A sort of one axis's few names, once per slot at plan time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; no owner holds an axis's midpoints.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanVariationDraw.ts#AutoMovieMotionHumanVariationDraw.basis

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the zero case and the three vectors.

## @evidence contracts/development/implementation.md#principled-implementation

An offset is stated along and across a movement, so its frame is built on the movement's direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reference axis and two cross products.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The second vector is across the world axis the direction is farthest from, so the basis never degenerates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's `Vector3`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanVariationDraw.ts#AutoMovieMotionHumanVariationDraw.quantity

## @evidence contracts/development/common.md#meaningful-documentation

States each input and the result's unit.

## @evidence contracts/development/implementation.md#principled-implementation

A spread narrows with skill as every skill quantity does, so it is read between its two ends by the owner of that reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanSkill.quantity`.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

One call with no case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanVariationDraw.ts#AutoMovieMotionHumanVariationDraw.scalar

## @evidence contracts/development/common.md#meaningful-documentation

States each input, the unit and the result with no room.

## @evidence contracts/development/implementation.md#principled-implementation

The spread shrinks by one factor of at most 1, the largest for which the offset at `TRUNCATE` stays inside the bound, so the offset keeps a normal's shape inside any bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One spread, one guard and one product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped, and no room reads no draw, so a slot without room moves no stream.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `quantity` and `normals`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
