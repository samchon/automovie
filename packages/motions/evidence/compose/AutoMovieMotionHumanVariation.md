# src/compose/AutoMovieMotionHumanVariation.ts#AutoMovieMotionHumanVariation

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, the absent result and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A stated proficiency is the skill of this action, so it replaces the two axes the spreads read; each slot's stream is the action's series on the channel `variation` and the slot key.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two range checks and one record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A value outside its range throws, a non-number included; no variation builds no source, so no draw can be read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads `IHumanActionContext.series`, the owner of the action's keyed streams.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The source holds the context's own series function and nothing else.

# src/compose/AutoMovieMotionHumanVariation.ts#AutoMovieMotionHumanVariation.strike

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the frame, the spread, the bound and the absent result.

## @evidence contracts/development/implementation.md#principled-implementation

A point inside a wide region is free within its name and the weapon also misses what was meant; only the miss grows with speed. The disc is the radial normal's quantile over a uniform angle, so the bound is a distance from the region's point and not a square.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two spreads, one shrink factor, one polar draw and one turn into the region's frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped: both spreads shrink by one factor until the disc's edge lies within the radius.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieMotionHumanVariationDraw.disc`; the scatter is `HumanSkill.scatter`'s, passed in by the striking law that knows the travel.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanVariation.ts#AutoMovieMotionHumanVariation.direction

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the spread, the bound and each input's meaning when absent.

## @evidence contracts/development/implementation.md#principled-implementation

A direction has two freedoms, so the turn's size and its heading about the direction come from one draw on a disc; the direction leans by the size toward a tangent at the heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bound, one polar draw and one rotation written as a sum of the direction and a tangent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A zero vector has no direction and is returned as it is; the tangent basis never degenerates because its reference is the world axis the direction is farthest from.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieMotionHumanVariationDraw.basis`, the frame a place's offset is built on, and its `disc`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanVariation.ts#AutoMovieMotionHumanVariation.duration

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the spread, the bound, what the bound guarantees and what is not passed through.

## @evidence contracts/development/implementation.md#principled-implementation

The motor term of Wing and Kristofferson's (1973) two-level timing model, a spread in seconds independent of the interval; the clock term is the manner's tempo offset, which stays where it is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped; a duration of 0 has no room and stays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The shared scalar offset; the spread's two ends are `HumanSkill.jitter`'s motor term.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanVariation.ts#AutoMovieMotionHumanVariation.pause

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, the spread, the two bounds and the fixed case.

## @evidence contracts/development/implementation.md#principled-implementation

The clock term of the timing model: an interval a performer times varies in proportion to its length, with the coefficient of variation `HumanSkill.jitter` uses (Wing and Kristofferson 1973; Grondin and Killeen 2009).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bound and one scalar offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is clamped; the name `none` has no length to vary.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads `PAUSES` of `AutoMovieMotionHumanTiming` through the shared cell rule and the shared scalar offset.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
