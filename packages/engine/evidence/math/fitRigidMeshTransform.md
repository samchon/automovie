# src/math/fitRigidMeshTransform.ts#fitRigidMeshTransform

## @evidence contracts/development/implementation.md#principled-implementation

Horn's symmetric quaternion eigensystem maximizes proper-rotation covariance; scaled centered clouds avoid product overflow and fixed Jacobi sweep/maximum ordering choose deterministic degenerate solutions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returned centers let the facial basis consumer apply centered coordinates without cancelling large translations against rotated absolute positions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scale, shear and reflection are never introduced to fit correspondence; malformed selections and nonrepresentable centering refuse.

## @evidence contracts/development/common.md#meaningful-documentation

States unique correspondence selection, centered application, fixed scale, Jacobi construction and physiological/nonpenetration limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S selected vertices, centroids and covariance cost O(S); twenty-four four-by-four Jacobi sweeps add fixed work and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One center and scale per cloud serve every covariance term; another target population requires a fresh fit.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Covariance/eigenvector arrays are temporary, and only a new quaternion and two center records escape without retaining mesh buffers.
