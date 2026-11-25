# src/compose/AutoMovieMotionClockNative.ts#AutoMovieMotionClockNative

## @evidence contracts/development/common.md#meaningful-documentation

Defines positive duration, unique and reserved names, the 1e-9 s endpoint allowance, sorted instants, unknown-name errors and fresh event records.

## @evidence contracts/development/implementation.md#principled-implementation

Named times use one map; clamped uniform progress delegates to Interval and minimum-jerk progress to the engine profile (Flash and Hogan 1985). The envelope is max(0, rise progress minus fall progress).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validate and build the map, build the sorted public records, then the at, linear, progress and envelope closures over the map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A repeated or reserved name and an instant outside the duration throw; an unknown name throws at its query.

## @evidence contracts/development/implementation.md#efficient-algorithms

Construction scans N instants and sorts them in O(N log N); each query is constant map and arithmetic work, and events are O(N) fresh output.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The closures share the constructor's map and the numeric interval and profile owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The clock owns its map, sorted array and closures until release; it retains no query time, event result or handle.

# src/compose/AutoMovieMotionClockNative.ts#AutoMovieMotionClockNative.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed names, the action-local seconds read and that an unknown name throws at the first sample.

## @evidence contracts/development/implementation.md#principled-implementation

A clock's named times are fixed for its life, so the window's two seconds read once give every later sample the same interval the clock's own linear and progress compute.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lazy interval feeds the original native callbacks through the constructor's lookup. A custom or replaced callback receives the clock as receiver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every native sample still runs the interval arithmetic and the profile. Custom samples keep current callbacks and do not probe unrelated clock methods.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two name lookups once on a native clock, then constant arithmetic per sample. Custom reads add one callback invocation to their clock's own work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the window's two seconds are shared, a constant of the clock.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader retains the clock, two names and at most one two-number interval until release.

# src/compose/AutoMovieMotionClockNative.ts#AutoMovieMotionClockNative.prepareEnvelope

## @evidence contracts/development/common.md#meaningful-documentation

Copies the four names and states that the rise is resolved before the fall, at the first sample, as the clock's own envelope reads them.

## @evidence contracts/development/implementation.md#principled-implementation

The clock's envelope is the rise's progress less the fall's, clamped at zero; both windows' seconds are constants of the clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The original envelope uses two lazy intervals from the constructor's lookup and one clamp. A custom or replaced envelope callback handles its own sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Native reads keep their clamp, easing and rise-before-fall order. A custom read keeps its receiver and its result, and retained callback tuples cannot change the prepared names.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four name lookups once on a native clock, then two progress evaluations per sample without tuples. Each custom read makes the two distinct tuples its callback receives.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the two windows' seconds are shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader retains the clock, four names and at most two intervals until release.
