# src/compose/AutoMovieMotionHumanHead.ts#AutoMovieMotionHumanHead.share

## @evidence contracts/development/common.md#meaningful-documentation

States the axis, the unit and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

The rig has two cervical joints, so a head angle is split between them in the stated share and the two parts sum to the whole.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two fresh zero triples receive the same selected-axis products directly, without a per-sample helper closure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The share is the named constant `NECK`; an even split is a modelling choice for a rig that lumps seven vertebrae into two joints, stated as such in the namespace comment.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every head phrase splits its angle here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanHead.ts#AutoMovieMotionHumanHead.nod

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, the window, the count and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

A nod is a repeated flexion about the held pose, so the angle is the amplitude times `AutoMovieMotionClock.wave`, which leaves and rejoins the pose at rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call to the shared oscillation with the flexion axis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the amplitude and the count are the caller's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares shake's oscillation; the first sample admits the fixed count and window through the Clock owner, and every later sample reads that wave.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive retains its arguments and at most one fixed wave reader until released, without retaining samples or postures.

# src/compose/AutoMovieMotionHumanHead.ts#AutoMovieMotionHumanHead.shake

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, the window, the count and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

A shake is a repeated twist about the held pose, so the angle is the amplitude times `AutoMovieMotionClock.wave`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call to the shared oscillation with the twist axis.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the amplitude and the count are the caller's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares nod's oscillation: the first sample admits the fixed count and window through the Clock owner.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive retains its fixed arguments and one lazy wave reader, without per-second samples or posture results.

# src/compose/AutoMovieMotionHumanHead.ts#AutoMovieMotionHumanHead.tilt

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, the two windows and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

A tilt that grows, stays and goes is the lateral angle scaled by the clock's envelope over the two windows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the amplitude and its side are the caller's signed angle.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `AutoMovieMotionHumanJoints.pulse` and `share`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.
