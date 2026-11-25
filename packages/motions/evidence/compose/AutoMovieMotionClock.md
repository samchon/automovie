# src/compose/AutoMovieMotionClock.ts#AutoMovieMotionClock.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed window; ClockNative.prepare states when its names are resolved.

## @evidence contracts/development/implementation.md#principled-implementation

The clock's named times are fixed for its life, so the window's two seconds read once serve every sample.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to ClockNative, the clock's constructor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every sample runs the interval arithmetic and the profile; no sample value is kept.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two name lookups once, then constant arithmetic per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the window's two seconds, constants of the clock, are shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader retains the clock, two names and at most one interval until release.

# src/compose/AutoMovieMotionClock.ts#AutoMovieMotionClock.prepareEnvelope

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed windows; ClockNative.prepareEnvelope states the resolution order and the clamp.

## @evidence contracts/development/implementation.md#principled-implementation

The clock's named times are fixed for its life, so each window's two seconds read once serve every sample.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to ClockNative, the clock's constructor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every sample evaluates both progresses and the clamp; no sample value is kept.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four name lookups once, then constant work per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the windows' seconds, constants of the clock, are shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader retains the clock, four names and at most two intervals until release.

# src/compose/AutoMovieMotionClock.ts#AutoMovieMotionClock

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, their order, the result and each refused input.

## @evidence contracts/development/implementation.md#principled-implementation

Uniform progress is the clamped linear map of the window, minimum-jerk progress is `minimumJerk` of it (Flash and Hogan 1985), and the envelope is the rise's progress less the fall's, clamped at zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates construction to ClockNative, which owns the validated map and the at, linear, progress and envelope closures.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A repeated or reserved name, an instant outside the duration and an unknown name throw; the only tolerance is 1e-9 s on the duration's end, for an instant computed as a sum of phase lengths.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each query is two map lookups and a polynomial, constant time, which matters because every primitive asks at every evaluated second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `minimumJerk`, the engine's one owner of the minimum-jerk profile.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The constructed clock retains one map, one sorted array and its closures, with no query history or external resource.

# src/compose/AutoMovieMotionClock.ts#AutoMovieMotionClock.sequence

## @evidence contracts/development/common.md#meaningful-documentation

States how phases become instants, what the duration is and each refused input.

## @evidence contracts/development/implementation.md#principled-implementation

An instant is the running sum of the lengths before it, so the phases tile the duration without a gap.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop that accumulates the lengths, then `of`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A negative length throws instead of being clamped; every other check is `of`'s.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Builds the clock through `of`, so both constructors share one validation.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One pass over a handful of phases, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing of its own; the clock it returns is `of`'s.

# src/compose/AutoMovieMotionClock.ts#AutoMovieMotionClock.phrase

## @evidence contracts/development/common.md#meaningful-documentation

States the instants, what a phase of no length does and each refused input.

## @evidence contracts/development/implementation.md#principled-implementation

Each standard instant is the running sum of the phase lengths before it, and the duration is their total.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One list of the six lengths in order, one loop, then `of`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A negative length throws instead of being clamped; a total of zero is refused by `of`.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Builds the clock through `of`, so every constructor shares one validation.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One pass over six lengths, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing of its own; the clock it returns is `of`'s.

# src/compose/AutoMovieMotionClock.ts#AutoMovieMotionClock.repeat

## @evidence contracts/development/common.md#meaningful-documentation

States the numbering by example, the result's consumer and the refused count.

## @evidence contracts/development/implementation.md#principled-implementation

A periodic movement is one period's phases repeated, so each repetition keeps the period's names with its ordinal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One nested map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A count of zero or a fraction throws instead of yielding an empty or a truncated list; lengths are validated by `sequence`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the phases produced, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionClock.ts#AutoMovieMotionClock.through

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, what 1 means, the arrested case and the value before, at and after the point.

## @evidence contracts/development/implementation.md#principled-implementation

One minimum-jerk unit (Flash and Hogan 1985) spans the whole window, and the point is passed at the share of the unit's time the first span takes; dividing by the unit's travel at that share makes the point 1. An arrested movement takes the share 0.5, where the unit's speed peaks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The unit's time is the first span's linear progress up to the point and the second span's after it, then one ratio of two profile values.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A first span under 1e-12 s steps at the point instead of dividing by it, and a second span under 1e-9 s reads as arrested; no other tolerance.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the windows through the clock's `linear` and the profile through `minimumJerk`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionClock.ts#AutoMovieMotionClock.stretch

## @evidence contracts/development/common.md#meaningful-documentation

States what a span is, how it is named, what the result keeps and the refused factor.

## @evidence contracts/development/implementation.md#principled-implementation

Each instant's new time is the running sum of the stretched spans before it, so the order of the instants and every name are kept and only lengths change.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the sorted instants with a running sum, then `of`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A factor of zero or less throws instead of collapsing or reversing a span.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Builds the result through `of`, so it has the same validation as every clock; `scale`, `align` and the manner's `time` are this function with a factor rule each.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One pass over a handful of instants, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing of its own; the clock it returns is `of`'s.

# src/compose/AutoMovieMotionClock.ts#AutoMovieMotionClock.scale

## @evidence contracts/development/common.md#meaningful-documentation

States which spans change, why the fixed ones do not, the defaults and each refused input.

## @evidence contracts/development/implementation.md#principled-implementation

A tempo is one factor on every span a performer chooses the length of; a span whose length physics sets is named and keeps its length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One check of the fixed names and one call of `stretch`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A fixed name the clock lacks throws through `at` instead of being ignored.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `stretch`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A handful of instants and names, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionClock.ts#AutoMovieMotionClock.align

## @evidence contracts/development/common.md#meaningful-documentation

States which spans stretch and which keep their length, who uses it and each refused input.

## @evidence contracts/development/implementation.md#principled-implementation

The spans before the instant share one factor, the asked second over the instant's own, so their proportions are kept and the instant lands on the second; the movement after the instant is the role's own and keeps its lengths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One factor and one call of `stretch`, whose rule switches to 1 at the first instant at or after the aligned one.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An instant at the start has no span to stretch and throws; instants within 1e-12 s of the aligned one count as at it, so two names at one time move together.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `stretch`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A handful of instants, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
