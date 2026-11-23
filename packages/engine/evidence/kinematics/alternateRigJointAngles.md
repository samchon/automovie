# src/kinematics/alternateRigJointAngles.ts#alternateRigJointAngles

## @evidence contracts/development/implementation.md#principled-implementation

The two charts of a three-angle composition differ by a half turn of each outer angle and the reflection of the middle one about its right angle, which leaves every entry of the composed matrix unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record of three sums; `decomposeJointRotationOnBasis` scores it against a range, so the chart rule is written once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No angle is wrapped or clamped and no bone is named.

## @evidence contracts/development/common.md#meaningful-documentation

States both composition orders with their second chart, the handedness term, the unit and that aliases are the caller's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three additions.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of three numbers with nothing to share between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned angles.
