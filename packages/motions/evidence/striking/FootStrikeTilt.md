# src/striking/FootStrikeTilt.ts#FootStrikeTilt

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, their frames and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The leg's elevation against the comfortable share of the range ellipse's reach at its azimuth, in closed form; the tilt turns the trunk away from the leg about the horizontal axis across it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Leg angles, limits, reach, then the tilt.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A leg within the range is left untilted; the tilt never passes the kick's lean bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work once per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The range table, its flexed abduction, the heading frame and the kick's lean bound.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/FootStrikeTilt.ts#FootStrikeTilt.chambered

## @evidence contracts/development/common.md#meaningful-documentation

States the excess, the turn, what it keeps and why.

## @evidence contracts/development/implementation.md#principled-implementation

A turn of the hip-to-ankle line about the horizontal axis across it lowers its elevation by the same angle and keeps its length, so the knee's fold and its rise above the line are unchanged: the excess is removed in closed form.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work once per plan.

# src/striking/FootStrikeTilt.ts#FootStrikeTilt.shank

## @evidence contracts/development/implementation.md#principled-implementation

The two-link closed form the limb fit solves, read once per plan.

# src/striking/FootStrikeTilt.ts#FootStrikeTilt.knee

## @evidence contracts/development/common.md#meaningful-documentation

States the untwisted direction, the twist and the clamp.

## @evidence contracts/development/implementation.md#principled-implementation

The swing-twist reading of the knee's direction about the leg, clamped in closed form to the range table's twist.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Leg, untwisted direction, twist, clamp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A hint within the range is returned unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work once per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The range table and the kick's range share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
