# src/posture/HumanHandShape.ts#HumanHandShape

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the unit and what the result covers.

## @evidence contracts/development/implementation.md#principled-implementation

A fist and the curled fingers of a point use the active closure angles documented in `HumanHand`. A flat hand is straight with its thumb laid in the palm's plane. A bridge is straight with its thumb at its neutral, spread from the forefinger. A relaxed finger takes the position of rest from the straight canonical finger.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Four fingers by three segments, then the thumb.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every segment is written for every shape, so no joint keeps an angle of the shape before.

## @evidence contracts/development/implementation.md#efficient-algorithms

The constant named table is constructed once per valid side and shape; each call still allocates its own record and fifteen angle tuples in original key order.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only private numeric snapshots of closed named shapes are shared; caller edits cannot change another result, including after the first cache miss.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The shared working/emblem cache has at most thirty entries of fifteen scalar joint rows, with no body or caller record retained; unsupported runtime names are not cached.

# src/posture/HumanHandShape.ts#HumanHandShape.emblem

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, what is returned and that the angles are provisional.

## @evidence contracts/development/implementation.md#principled-implementation

Each digit is straight, folded as in the fist, or bent to the angles its shape names; a spread or a crossing is the proximal joint's abduction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table of digit states per shape and one loop that writes them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fold shares the fist's 85, 95 and 70 degree flexion angles. The distal angle approximates the measured endpoints of active hand closure. [Active grip and release, Fig. 3](https://doi.org/10.3390/biomimetics8020244).

## @evidence contracts/development/implementation.md#efficient-algorithms

The constant emblem decisions and bone names are constructed once per valid side and form, followed by fifteen fresh angle-tuple copies per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Private scalar snapshots share only the closed named table, preserving both first-miss and hit result ownership and key order.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The working/emblem cache holds at most thirty fifteen-joint snapshots with no body or result reference; other runtime names stay uncached.

# src/posture/HumanHandShape.ts#HumanHandShape.digit

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured, from which joint to which, the frame and why it differs from the hand's axes.

## @evidence contracts/development/implementation.md#principled-implementation

The rig's own forward kinematics of the hand at rest with the angles applied, read back into the hand's frame, so the direction is the one the displayed digit takes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose, one resolve, one difference and one rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The joints are the ones the verdicts read a digit by, never a guessed axis.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward-kinematics pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `poseBones`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/posture/HumanHandShape.ts#HumanHandShape.aim

## @evidence contracts/development/common.md#meaningful-documentation

States what is turned, onto what, and what is kept.

## @evidence contracts/development/implementation.md#principled-implementation

The shortest arc between the digit's world direction and the vertical, applied before the hand's rotation; opposite directions take half a turn about a direction across the digit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One carried direction, one arc and one product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A digit already on the vertical keeps the rotation unchanged.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/posture/HumanHandShape.ts#HumanHandShape.tip

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the curl's reading and the measured defect.

## @evidence contracts/development/implementation.md#principled-implementation

The shape's angles plus the curl on the fingers, as `AutoMovieMotionHumanHand` displays them, posed by forward kinematics, the surface read on its distal phalanx's region; a pad is the support of the digit's own collider along the pad's outward normal (`physicalShapeSurfaceAnchor`), so the pad a goal lays on a surface and the collider the floor and contact audits read are one geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pose, one region placement, a pad's collider support, and one change of frame.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The curl is not added to the thumb, whose flexion closes across the palm.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the body's forward kinematics, its surface frames and its collider placement.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward kinematics, and for a pad one collider placement, per call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the frame is the caller's.
