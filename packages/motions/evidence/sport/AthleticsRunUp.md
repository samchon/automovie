# src/sport/AthleticsRunUp.ts#AthleticsRunUp.IApproach

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and frame.

## @evidence contracts/development/design.md#principled-representation

World metres and m/s on the horizontal plane; the heading has unit length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The take-off foot, the speed, the heading and the planted ankle the events read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record exists only for an admitted approach, so no member is optional.

# src/sport/AthleticsRunUp.ts#AthleticsRunUp

## @evidence contracts/development/common.md#meaningful-documentation

States inputs, the absent case and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The root's displayed linear velocity, projected on the floor, is the approach; the take-off foot is the one the run has planted at the cut, as a one-foot take-off needs (World Athletics TR27.1 for the high jump; the long jump, triple jump and vault plant one foot likewise).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Decide the run, the foot, then the speed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A cut between footfalls or a slow run is refused with the planted feet or the speed it has, never re-timed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work on the entry record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads only values the entry already holds.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh vectors and retains nothing.

# src/sport/AthleticsRunUp.ts#AthleticsRunUp.hips

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the frame and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The root carries the hips' rest offset rotated by the yaw, pitch and roll the posture's heading composes (`humanPostureHeading`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation and one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The joints below the hips do not move them, so no solve is needed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each posture is read once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector.

# src/sport/AthleticsRunUp.ts#AthleticsRunUp.stance

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and its fallback.

## @evidence contracts/development/implementation.md#principled-implementation

The run's own leg goal at the same film second, so the stance's heel rise about the toes' joint and its reach are the run's, already met by its legs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One posture read of the interrupted plan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the run's plan; nothing is restated.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture evaluation of the run per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each second is read once by its caller.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh values.
