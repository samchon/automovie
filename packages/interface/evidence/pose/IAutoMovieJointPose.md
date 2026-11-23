# src/pose/IAutoMovieJointPose.ts#IAutoMovieJointPose

## @evidence contracts/development/design.md#principled-representation

Flexion, abduction and twist match declared clinical axes for direct degree-range checks before jointToQuaternion composes rotations in the rig basis; null is neutral and an unavailable axis admits null or zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A bone identity and three nullable scalar angles expose articulation without mixing rest transforms, root movement or quaternion storage into the authored joint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Limits come from the effective target constraint rather than an actor or fixture; nonzero motion on an unavailable axis is reported, while neutral null and zero are deliberately equivalent.

## @evidence contracts/development/common.md#meaningful-documentation

Defines clinical axis signs, degree units, composition over the rest transform and neutral-null semantics, including the restriction for immovable axes.
