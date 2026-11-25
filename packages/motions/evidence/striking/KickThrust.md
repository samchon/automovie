# src/striking/KickThrust.ts#KickThrust.ILeg

## @evidence contracts/development/common.md#meaningful-documentation

States what the type holds, with units and frame.

## @evidence contracts/development/design.md#principled-representation

A leg is its two segment vectors from the hip, the form its swing, its planted triangle and its thrust all read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the members its readers take.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's vector type; no flag or cached result is carried.

# src/striking/KickThrust.ts#KickThrust.planted

## @evidence contracts/development/common.md#meaningful-documentation

States the triangle, the knee's side and the case of a hip beyond the leg's length.

## @evidence contracts/development/implementation.md#principled-implementation

The two-segment triangle from the hip to the ankle by the law of cosines, its apex on the read knee's side of the hip-to-ankle line.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed-form construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A hip farther than the leg is long gives the straight leg and the shank carries the excess; no reach is clamped silently elsewhere.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond its result.

# src/striking/KickThrust.ts#KickThrust.drawn

## @evidence contracts/development/common.md#meaningful-documentation

States the thigh's raise, its bound, the fold and the measured reason.

## @evidence contracts/development/implementation.md#principled-implementation

The knee is put at the contact ankle's height by the thigh's raise in the vertical plane of the contact's reach, bounded by KickForm.PUSH_RAISE_MOST, and the shank is folded from the thigh by the chamber's flexion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed-form construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The raise is bounded by a named clinical range and the flexion is the kick's own chamber flexion; nothing is fitted to a target or a body.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per leg path by its caller.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond its result.

# src/striking/KickThrust.ts#KickThrust.footed

## @evidence contracts/development/common.md#meaningful-documentation

States the turn, what the ankle takes up, the coached form and the measured reason.

## @evidence contracts/development/implementation.md#principled-implementation

The great-arc turn from the contact shank to the current one, shortened by the ankle's named range about the same axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One angle, one share, one interpolation from no turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The give is a named clinical range, not a value fitted to a target; a shank within it leaves the foot on its contact rotation exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/KickThrust.ts#KickThrust.thrusting

## @evidence contracts/development/common.md#meaningful-documentation

States the ankle's line, its bound past the contact and the knee's side.

## @evidence contracts/development/implementation.md#principled-implementation

The ankle is interpolated on the straight line between the two ends' ankles in the pelvis's frame and the knee follows by the two-segment triangle, its side read between the two ends' knees.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed-form construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Past the contact the ankle is held within the reach the least flexion gives; the contact leg is met exactly at share one.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The two ends and the reach bound are fixed once; each share is evaluated anew.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond its result.
