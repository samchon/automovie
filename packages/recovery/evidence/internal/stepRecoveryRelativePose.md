# src/internal/stepRecoveryRelativePose.ts#stepRecoveryRelativePose

## @evidence contracts/development/implementation.md#principled-implementation

Engine axis-angle rotation implements the SO3 exponential and rotates each current R column on the left. Translation is normalize(t+B*delta), whose zero derivative is DN(t)B and equals B only for an exact unit tangent. Signed Sampson residuals cancel this positive normalization scale, so their model differentiates the complete quotient using raw B. Map owners separately preserve the current radius and differentiate that actual chart.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One camera-update owner matches the optimizer's five local derivatives, while generic quaternion rotation remains in engine and the numerical state remains ordinary row-major arrays.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No Euler-angle clipping, affine rotation, fixed baseline length or forced sign supplies a camera. Nonrepresentable steps or a zero direction throw instead of returning the previous pose.

## @evidence contracts/development/common.md#meaningful-documentation

States radians-to-engine-degrees conversion, left composition, row-major columns and local sphere retraction with no metric scale.

## @evidence contracts/development/implementation.md#efficient-algorithms

One axis-angle construction, three vector rotations and one three-coordinate norm cost constant time and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One increment quaternion rotates all three columns; the tangent basis comes from the same local derivative model rather than being reconstructed with a different axis choice.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

New pose arrays transfer to the caller and no borrowed state, image, quaternion cache or external handle remains.
