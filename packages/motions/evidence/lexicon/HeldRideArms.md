# src/lexicon/HeldRideArms.ts#HeldRideArms.IKept

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

A posture and the plan's own contact and hold records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/lexicon/HeldRideArms.ts#HeldRideArms

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The entry's displayed wrist joint, hand rotation and elbow joint (`poseBones`) become the arm's goal, point, rotation and bend, and its displayed finger angles the fingers' (`AutoMovieMotionHumanArm.angles`); the ride carries world goals with its support. The held prop's grip window and hold are the entry grip's (`AutoMovieMotionHumanHeld.grip`, `hold`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the two sides.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A rein or grip hand and an empty hand are left to the ride.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two arm-chain readings, two angle reads and two held reads per plan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records.
