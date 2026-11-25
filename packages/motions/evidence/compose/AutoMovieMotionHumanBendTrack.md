# src/compose/AutoMovieMotionHumanBendTrack.ts#AutoMovieMotionHumanBendTrack.IGoal

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The part of `AutoMovieMotionHumanBend.ISolve` that varies over a span.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by the search.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The rotation is absent exactly where `solve` takes none.

# src/compose/AutoMovieMotionHumanBendTrack.ts#AutoMovieMotionHumanBendTrack.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and frame.

## @evidence contracts/development/design.md#principled-representation

The fixed body and arm, the span and the goal over it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, all read by the knots and the read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The fallback is `solve`'s own, required because a track never throws on a frame.

# src/compose/AutoMovieMotionHumanBendTrack.ts#AutoMovieMotionHumanBendTrack.IProps.goal

## @evidence contracts/development/common.md#meaningful-documentation

States when the member is called and what it gives.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; the primitive that makes the track, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; the primitive that makes the track, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; the primitive that makes the track, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; the primitive that makes the track, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; the primitive that makes the track, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; the primitive that makes the track, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanBendTrack.ts#AutoMovieMotionHumanBendTrack.ITrack

## @evidence contracts/development/common.md#meaningful-documentation

Each member states when it is called and what it gives.

## @evidence contracts/development/design.md#principled-representation

The plan's one preparation and its read, as `IAutoMovieMotionHumanPrimitive` separates them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both called by the primitive that owns the track.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A read before any preparation is the cold solve, not a guess.

# src/compose/AutoMovieMotionHumanBendTrack.ts#AutoMovieMotionHumanBendTrack.ITrack.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States when the member is called and what it gives.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; `of`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; `of`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; `of`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; `of`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; `of`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; `of`, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanBendTrack.ts#AutoMovieMotionHumanBendTrack.ITrack.elbow

## @evidence contracts/development/common.md#meaningful-documentation

States when the member is called and what it gives.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; `of`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; `of`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; `of`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; `of`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; `of`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; `of`, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanBendTrack.ts#AutoMovieMotionHumanBendTrack

## @evidence contracts/development/common.md#meaningful-documentation

States the knots, the continuation and its walk, the cold cases, the read and its cold cases.

## @evidence contracts/development/implementation.md#principled-implementation

Numerical continuation of a minimiser along a parameter (the second): each solve starts from its neighbour's, so the elbow stays in one basin while that basin holds an allowed place, and the result depends on the second alone because the knots are solved once, in time order. Limitation: where the cold search would move to another basin of less strain while this one stays allowed, the track keeps this one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The knots' times, one knot's solve, the preparation's loop, the read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The grid is the planner's hold grid, the continuation's bracket and resolution the engine's (`hingedArmSwivel`), the walk's bound a full turn of that bracket; an unallowed continuation is never returned.

## @evidence contracts/development/implementation.md#efficient-algorithms

One cold search and one refinement a knot at preparation, more refinements only while a knot's swivel moves more than a step; one refinement a read. Driven by the span's knots and the seconds read. Unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The knots are shared by every read of the plan; they are a function of the action's own postures and goal, fixed once the action is planned.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The track keeps one seed a knot, `(to - from) / STEP + 2` at most, for the plan's life; no posture, reader or read result is kept.
