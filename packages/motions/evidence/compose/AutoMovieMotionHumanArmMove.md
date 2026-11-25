# src/compose/AutoMovieMotionHumanArmMove.ts#AutoMovieMotionHumanArmMove.move

## @evidence contracts/development/common.md#meaningful-documentation

States what moves, by what, and the channels claimed.

## @evidence contracts/development/implementation.md#principled-implementation

A path of the surface that is straight, or bows out to the arm's own side by the movement's `curvature` (a manner's share of the path's length, EMOTE's indirect Space; none when absent), and a spherical interpolation of the hand, both by one weight, with the fingers shaped by the same weight (Jeannerod 1984).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One target evaluation, one blend and one posture update.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The weight is clamped to [0, 1] so an overshooting time course cannot extrapolate the hand past its target; at weight 1 the target is used as it is, with no blend error.

## @evidence contracts/development/implementation.md#efficient-algorithms

Every target, weight, path, rotation and wrist placement remains actual. A target row carrying its issuer's offset places the wrist from it; other rows read the hand. Fifteen fresh finger triples write directly into one copied joint map, without an intermediate map/spread.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The hand owner shares named finger scalars for the last shape the target named, the move's side being fixed. ArmTarget places from a row's carried offset, and other rows read the hand. The actual target invocation borrows host FK/ROM metadata synchronously; every current callback, bowed point, rotation, curl and weight remains actual.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive retains props and at most one fifteen-entry finger writer. Its current source target is an invocation local; no posture, world target/rotation, time, curl, weight or completed goal/finger result is retained.

# src/compose/AutoMovieMotionHumanArmMove.ts#AutoMovieMotionHumanArmMove.reach

## @evidence contracts/development/common.md#meaningful-documentation

States the two ends, the window and the time course.

## @evidence contracts/development/implementation.md#principled-implementation

A point-to-point hand movement follows the minimum-jerk profile (Flash and Hogan 1985), which the clock's progress is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `move` with the clock's progress as the weight.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The window is two named instants of the clock, so no time is written twice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to move; the window's two instants, constants of the clock, are resolved once for every written second.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two name lookups once instead of at every written second; every target, path, finger and goal evaluation remains. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive retains its original arguments and at most one constant-size fixed-window reader until release, with no progress/time/result history.

# src/compose/AutoMovieMotionHumanArmMove.ts#AutoMovieMotionHumanArmMove.hold

## @evidence contracts/development/common.md#meaningful-documentation

States the window and that the target may move.

## @evidence contracts/development/implementation.md#principled-implementation

A hand on its target is the movement at weight 1 throughout, so the target frame alone decides where the hand is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `move` with a constant weight.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The origin `move` requires is never read at weight 1, so the identity origin passed is inert and stated here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to move; the weight is the original constant one and every actual target stays current.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant hold setup with no interpolation algorithm to choose; move owns each actual target/finger/goal cost.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its original arguments and move's fixed shape metadata, with no sampled target or time history.

# src/compose/AutoMovieMotionHumanArmMove.ts#AutoMovieMotionHumanArmMove.retract

## @evidence contracts/development/common.md#meaningful-documentation

States the two ends, the window and the time course.

## @evidence contracts/development/implementation.md#principled-implementation

A reach run backwards: the same minimum-jerk profile with the weight going from 1 to 0.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `move` with one minus the clock's progress.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The target stays a frame, so a hand leaving a moving thing starts from where the thing is.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to move; the window's two instants, constants of the clock, are resolved once, and the weight is one minus their progress.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two name lookups once instead of at every written second; all target, path, finger, goal and easing work remains. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive retains its original arguments and one lazy constant-size interval reader until release, with no progress, target or time history.
