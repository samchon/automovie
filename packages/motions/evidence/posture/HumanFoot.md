# src/posture/HumanFoot.ts#HumanFoot.headingPitch

## @evidence contracts/development/common.md#meaningful-documentation

States world rotation input, degree outputs, shared heading and the past-vertical pitch convention.

## @evidence contracts/development/implementation.md#principled-implementation

Uses heading's original lateral-axis direction and pitch's original forward-axis projection; the one heading feeds the same pitchAt formula as raw pitch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One heading read and one forward-axis read supply the pair, with the pitch formula owned once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normalization, clamp, range or angle convention changes, and neither angle is cached across rotations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work; a consumer of both angles omits the repeated lateral-axis rotation and heading atan2 that separate heading/pitch calls require.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both scalar values derive from this same supplied quaternion within this call; no identity, pose or time key is involved.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh scalar pair and retains no input or state.

# src/posture/HumanFoot.ts#HumanFoot.pivot

## @evidence contracts/development/common.md#meaningful-documentation

States the pivot and every angular convention.

## @evidence contracts/development/implementation.md#principled-implementation

The ankle is the fixed world pivot minus its rotated bone-local offset, including a socket carried by the toe joint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation and one rigid-point translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses offset as the sole owner of toe articulation.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses rotation and offset.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
