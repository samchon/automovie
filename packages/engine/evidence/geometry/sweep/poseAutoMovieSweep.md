# src/geometry/sweep/poseAutoMovieSweep.ts#poseAutoMovieSweep

## @evidence contracts/development/implementation.md#principled-implementation

Sweep-based deformation: key sections ride their links or turn with both links at a joint, the centre curve and orientations are re-interpolated in the pose, and volume is restored by rescaling the joint section using the swept-volume integral. Limitation: sections on the inside of a tight bend may still cross; the paper resolves that with collision handling, which is not implemented.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Posing produces an ordinary sweep, so sampling, tiers and fitting are reused unchanged for posed surfaces.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Misaligned bindings are refused, and volume preservation changes only the declared joint stations' scale rather than any other parameter.

## @evidence contracts/development/common.md#meaningful-documentation

States how points, planes and joint stations move, the interpolation, the volume rule and its source, and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N + S) for N spine points and S stations, plus one rest compile; volume preservation adds at most nine compiles and volume integrals of O(400 * 256) radius queries each.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call poses one sweep; the bone motion lookup caches each bone's rotation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the compiled surfaces used for frames and volume are released on return.
