# src/pose/IAutoMoviePoseJointCodec.ts#IAutoMoviePoseJointCodec.ICodec

## @evidence contracts/development/common.md#meaningful-documentation

Pairs clinical-angle conversion with the joint mobility predicate used by pose blending.

## @evidence contracts/development/design.md#principled-representation

Angles are ordered flexion/abduction/twist degrees; rotations are unit bone-local rest-relative quaternions interpreted through one rig.

## @evidence contracts/development/design.md#minimal-and-owned-surface

poseJointCodec indexes the rig's axes/ranges once and supplies the same forward/inverse convention to difference and blend consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A hinge or two-axis joint is not closed under arbitrary quaternion composition; ball keeps those joints on their admitted angle coordinates.
