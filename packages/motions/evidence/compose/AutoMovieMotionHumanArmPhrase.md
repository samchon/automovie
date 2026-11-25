# src/compose/AutoMovieMotionHumanArmPhrase.ts#AutoMovieMotionHumanArmPhrase.bearing

## @evidence contracts/development/common.md#meaningful-documentation

States the two instants and when no window is returned.

## @evidence contracts/development/implementation.md#principled-implementation

A plan's contact window is a share of its duration, so each instant's seconds are divided by the clock's duration; a place in the air bears nothing and gets no window.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional and one record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the kind and the support are the phrase's own, and an unknown instant throws through the clock.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every arm phrase builds its window here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanArmPhrase.ts#AutoMovieMotionHumanArmPhrase.visit

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, the instants it travels, stays and returns on, and when it carries a contact window.

## @evidence contracts/development/implementation.md#principled-implementation

A point-to-point reach and its return are minimum-jerk movements (Flash and Hogan 1985), so the hand's weight toward the place is the clock's envelope rising to `stroke` and falling from `relax`, at rest on the place between. A place in the air is scaled about the origin by the manner's extent; a solid one is not.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One `move` over the whole clock with the envelope as its weight, and the window from `bearing`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the place, the origin and the timing are the caller's, and no constant is stated here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates blend/curve/timing to their owners and forwards Move's same-body FK/genuine ROM loan through the actual target invocation; current target data is never cached here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second beyond `move`'s fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.

# src/compose/AutoMovieMotionHumanArmPhrase.ts#AutoMovieMotionHumanArmPhrase.stroke

## @evidence contracts/development/common.md#meaningful-documentation

States phases, path progress and contact window; both the current-progress and original zero-progress path calls receive the same optional synchronous FK/ROM metadata.

## @evidence contracts/development/implementation.md#principled-implementation

The phases of a gesture (Kendon 1980: preparation, hold, stroke, hold, retraction): the weight rises to the ready pose by `ready` and falls from `relax`, and the path is read at the clock's minimum-jerk progress from `strokeStart` to `strokeEnd`. A path in the air is scaled about its ready point by the manner's extent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One `move` over the whole clock; the path decides the shape and this function only the progress it is read at.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the path and the timing are the caller's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Move supplies the current same-body FK/genuine ROM loan to both original path invocations. Their actual posture/seconds/progress remain distinct inputs, and each original path/extent/contact calculation still runs without a sampled target cache.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second beyond `move`'s fit and the caller's path, which is read at both current and zero progress whenever progress is positive, regardless of contact or extent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.

# src/compose/AutoMovieMotionHumanArmPhrase.ts#AutoMovieMotionHumanArmPhrase.preparedStroke

## @evidence contracts/development/common.md#meaningful-documentation

Defines the native contact and optional onset-validation boundary.

## @evidence contracts/development/implementation.md#principled-implementation

A bearing target's extent is fixed by the contact, so the onset target cannot change its position.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares the regular stroke primitive with an optional onset validator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Callers must preserve any original dynamic onset refusal and external callback observation before using this route.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluates one complete target per sample plus any required onset validation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The original clock, arm move and bearing window consume the unchanged current target.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the stroke and optional validator for the life of the primitive.

# src/compose/AutoMovieMotionHumanArmPhrase.ts#AutoMovieMotionHumanArmPhrase.strike

## @evidence contracts/development/common.md#meaningful-documentation

States the phases with their instants, the free and the arrested ending and when it carries a contact window.

## @evidence contracts/development/implementation.md#principled-implementation

The hand's point runs from the chamber along the line to the target by `AutoMovieMotionClock.through`, which is 1 at `stroke` with speed, so a free strike travels past the target by the overshoot and an arrested one stops on it; the rotation and the bend stop at the target's. A target in the air is scaled about the chamber by the manner's extent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One `move` over the whole clock whose target is the chamber before `strokeStart` and the line after it; the weapons pass through to the primitive.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the overshoot follows from the follow phase's length, not from a stated distance. Stopping on the first surface met is the performance's arrest, not decided here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Move's optional same-body FK/genuine ROM metadata reaches the actual chamber and target callbacks. through/bearing retain timing/contact ownership and no callback answer is memoized.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second beyond `move`'s fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.

# src/compose/AutoMovieMotionHumanArmPhrase.ts#AutoMovieMotionHumanArmPhrase.oscillate

## @evidence contracts/development/common.md#meaningful-documentation

States the phases with their instants, what the pose's swing means and when it carries a contact window.

## @evidence contracts/development/implementation.md#principled-implementation

A repeated movement about a pose is `AutoMovieMotionClock.wave`, which leaves and rejoins the pose at rest; the pose maps the swing to a target, so the amplitude and its direction are the caller's. In the air the swing is scaled by the manner's extent; on a solid place it is not.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One `move` over the whole clock, its weight the envelope to `ready` and from `relax`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: no amplitude or period is stated here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `move`, `wave` and `bearing`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second beyond `move`'s fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.

# src/compose/AutoMovieMotionHumanArmPhrase.ts#AutoMovieMotionHumanArmPhrase.swing

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, that the arm's goal is released, and the window's unit.

## @evidence contracts/development/implementation.md#principled-implementation

A swinging arm is driven from the shoulder with no place for the hand, so the two joints are written by angle and the arm's limb goal is removed, which leaves the solver nothing to pull the hand to.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One write: the two joints set and the limb goal deleted. The window is in seconds because a gait's phase, not a named instant, drives the angles.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the angles are the caller's, and the other joints and limbs pass through.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.
