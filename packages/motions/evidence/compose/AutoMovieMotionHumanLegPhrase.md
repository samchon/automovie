# src/compose/AutoMovieMotionHumanLegPhrase.ts#AutoMovieMotionHumanLegPhrase.bearing

## @evidence contracts/development/common.md#meaningful-documentation

States the two instants and when no window is returned.

## @evidence contracts/development/implementation.md#principled-implementation

A plan's contact window is a share of its duration, so each instant's seconds are divided by the clock's duration; a place in the air bears nothing and gets no window.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional and one record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the kind and the support are the phrase's own, and an unknown instant throws through the clock.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `tap`, `swing` and `pivot` build their windows here. The arm's `bearing` is the same four lines with the hand as the part; the two are kept beside their phrases rather than joined behind a part parameter.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanLegPhrase.ts#AutoMovieMotionHumanLegPhrase.between

## @evidence contracts/development/common.md#meaningful-documentation

States both interpolations and where the share is clamped.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid placement is a point and a rotation: the point is interpolated on the line and the rotation by spherical interpolation, the constant-speed path between two rotations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record of two interpolations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ankle is not clamped, so a share past 1 carries a swing past its target and an extent above 1 enlarges a place in the air; the rotation is clamped because a turn past the target's has no meaning the callers ask for.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every leg phrase and the extent's scaling blend placements here, on `Vector3` and `Quaternion.slerp`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanLegPhrase.ts#AutoMovieMotionHumanLegPhrase.prepareBetween

## @evidence contracts/development/common.md#meaningful-documentation

States fixed borrowed endpoints, fresh output ownership and the distinct unclipped ankle/clipped rotation policies.

## @evidence contracts/development/implementation.md#principled-implementation

Native Vector3.prepareLerp retains between's a+(b-a)*share component arithmetic, and Quaternion.prepareSlerp retains its shorter-arc choice, interpolation threshold, actual weights and final normalization after the same explicit rotation clamp.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fixed quaternion reader and one lazy fixed ankle reader feed the two original placement fields; dynamic phrase callbacks continue using between with their current endpoints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No share, endpoint, interpolation or ownership shortcut is introduced. The ankle extrapolates unchanged, rotation still clamps, and even endpoint queries compute fresh records with the native arithmetic.

## @evidence contracts/development/implementation.md#efficient-algorithms

The first actual read prepares fixed endpoint vector differences and quaternion metadata once across Q evaluations; every query still computes the current affine point, spherical weights and normalization. Runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller establishes unchanged placement point/rotation values for this reader's lifetime; changed endpoints require a new preparation. No current share, ankle, rotation or achieved posture is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owning action retains its two fixed placements, one bounded quaternion reader and at most one six-scalar vector reader until release; returned placements retain no reader or query history.

# src/compose/AutoMovieMotionHumanLegPhrase.ts#AutoMovieMotionHumanLegPhrase.lift

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, its instants and when the foot is planted.

## @evidence contracts/development/implementation.md#principled-implementation

A foot raised and set back is the stance blended toward the raised placement by the clock's minimum-jerk envelope, at rest at both ends and while held. A raised placement in the air is scaled about the stance by the manner's extent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One `place` over the whole clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the raised placement is the caller's. The phrase adds no contact window even when a contact is stated, since a raised foot bears on nothing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates the solve to `place`, the blend to `between` and the timing to the clock.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second beyond `place`'s solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.

# src/compose/AutoMovieMotionHumanLegPhrase.ts#AutoMovieMotionHumanLegPhrase.tap

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, its instants, the clearance's unit and when the foot is planted.

## @evidence contracts/development/implementation.md#principled-implementation

A foot carried to a place clears the floor on the way, so both trips are the leg's arc with the stated clearance on the clock's minimum-jerk progress. A place in the air is scaled about the stance by the manner's extent, and the foot is planted on the place only when it is solid.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One `place` whose placement is the outward arc until `relax` and the return arc after it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the place and the clearance are the caller's, and a place in the air is neither planted nor given a window.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `place`, the arc that `step` uses, and `bearing`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second beyond `place`'s solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.

# src/compose/AutoMovieMotionHumanLegPhrase.ts#AutoMovieMotionHumanLegPhrase.swing

## @evidence contracts/development/common.md#meaningful-documentation

States the phases with their instants, the free and the arrested ending, the contact window and when the foot is planted.

## @evidence contracts/development/implementation.md#principled-implementation

The foot runs from the chamber along the line to the target by `AutoMovieMotionClock.through`, which is 1 at `stroke` with speed, so a free swing travels past the target and an arrested one stops on it; the envelope carries the foot from and back to its stance. A target in the air is scaled about the chamber by the manner's extent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One `place` over the whole clock: the chamber before `strokeStart`, the line after it, blended with the stance by the envelope. The arm's `strike` has the same shape.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the overshoot follows from the follow phase's length, not from a stated distance. Stopping on the first surface met is the performance's arrest, not decided here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `place`, `between`, `through` and `bearing`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second beyond `place`'s solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive closes over its arguments only.

# src/compose/AutoMovieMotionHumanLegPhrase.ts#AutoMovieMotionHumanLegPhrase.pivot

## @evidence contracts/development/common.md#meaningful-documentation

States the movement, its instants, the units and signs of the two angles and the contact window.

## @evidence contracts/development/implementation.md#principled-implementation

A foot that turns on the floor rotates about the sole point that stays, so the point is read once from the stance and the ankle is placed by the rigid relation `HumanFoot.pivot` owns as the heading and the pitch grow by the clock's envelope.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The stance's point, heading and pitch are read once; the placement adds the enveloped turn and pitch to them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: the foot stays planted and its window is a pivot on the ground, so the sole point is held and the rest of the sole is free to turn.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `place`, `HumanFoot.point`, `HumanFoot.pivot` and `bearing`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per evaluated second beyond `place`'s solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitive keeps its arguments, one point and two angles.
