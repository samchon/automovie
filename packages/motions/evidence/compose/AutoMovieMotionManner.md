# src/compose/AutoMovieMotionManner.ts#AutoMovieMotionManner.resolve

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, which draws are read and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The tempo is Effort's tempo over the pace, the extent Effort's extent times the intensity, and each takes a seeded offset whose bound narrows from the novice's to the expert's with proficiency. A hold lasts longer in bound Flow and shorter in free Flow, EMOTE's direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The defaults, four range checks, one offset helper and the record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each member outside its range throws, a non-number included. The Flow share `HOLD` and the extent's bounds are provisional, named constants with their status stated; the tempo's bounds come from the variability `HumanSkill.jitter` uses.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads `HumanEffort.modifiers` for the Effort mapping. No variation reads no draw, so a manner without it is deterministic whatever the stream.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionManner.ts#AutoMovieMotionManner

## @evidence contracts/development/common.md#meaningful-documentation

States where the draws and the default proficiency come from.

## @evidence contracts/development/implementation.md#principled-implementation

A performer's own timing skill is the proficiency a manner means when it states none, and the action's `manner` channel keeps the variation apart from the law's other draws, so adding a manner does not move them. A replan's time scale lengthens what its speed bound limits, the motion, and not a hold, which is a duration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional and one call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: a stated proficiency overrides the performer's, and the ranges are checked by `resolve`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `resolve`; every law resolves its manner here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionManner.ts#AutoMovieMotionManner.time

## @evidence contracts/development/common.md#meaningful-documentation

States which spans take which factor, that the names are kept and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A manner changes how long a performer takes, not how long a body falls: the spans physics fixes keep their length, a hold takes the hold factor and the rest the tempo.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The two lists are resolved and checked, then one `stretch` picks a factor per span.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A stated instant the clock lacks throws through `clock.at` even when the manner is neutral; the default holds are only the standard ones the clock has, so a clock that is not a phrase is retimed by the tempo alone.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `AutoMovieMotionClock.stretch`; a neutral manner returns the clock itself.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A handful of instants; the list lookups are over at most that many names.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
