# src/film/projectToNdc.ts#projectToNdc

## @evidence contracts/development/implementation.md#principled-implementation

The pinhole perspective projection: the point is brought into the camera frame by the inverse rotation about the lens and divided by depth times the half-field tangents, then an affine remap takes the crop window's NDC span to `[-1, 1]`; it relies on a unit camera rotation and a point in front of the lens, and states that it does not guard the latter.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One projection shared by the shot contract, the visual read, pose keypoints, the film grammar and geometry measurement, with the crop conversion shared with the frustum tests.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamping or depth floor is applied, so callers see the real geometry and decide visibility themselves; the whole-gate branch skips a division by one rather than changing the answer.

## @evidence contracts/development/common.md#meaningful-documentation

States the axis convention, the projection formula, how a crop rescales NDC, the behind-lens and zero-depth results, who decides visibility, the crop error, and each parameter's frame and units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one quaternion inverse, one rotation, one crop conversion and a handful of divisions.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure projection of one point that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates a few temporary vectors and retains nothing; the caller owns the returned record.
