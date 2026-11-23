# src/skeleton/AutoMovieJointTwistPlacement.ts#AutoMovieJointTwistPlacement

## @evidence contracts/development/design.md#principled-representation

The two values are the two orders in which a swing and a rotation about the moved segment's long axis can compose, and each is inverted in closed form by `decomposeJointRotation`, a ZYX extraction for proximal and a YXZ extraction for distal after changing to the joint's own basis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed two-value union on `IAutoMovieJointAxes`, so the order is declared beside the axes it orders and both composition and inversion read it from the same record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No bone name is special-cased in the composer: an arm bone's distal order comes only from its declared axes, and `validateJointAxesBasis` refuses any other string.

## @evidence contracts/development/common.md#meaningful-documentation

States each value's anatomical meaning with an example, its quaternion order, the equality without twist, the default, which bones declare distal, and which functions read it.
