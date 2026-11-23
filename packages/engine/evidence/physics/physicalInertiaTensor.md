# src/physics/physicalInertiaTensor.ts#physicalInertiaTensor

## @evidence contracts/development/implementation.md#principled-implementation

The rotation of a principal tensor into another frame, `R diag(I) R^T`, written as the sum over the principal axes `a_k` of `I_k a_k a_kᵀ`, and the parallel-axis (Huygens-Steiner) theorem for the shift of each part's mass to the point; both are exact, so the sum is the rigid assembly's tensor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Direct assembly/spin share one component kernel that rotates three axes and evaluates scalar terms. Prepared reads retain the same intrinsic expressions in private rotated storage, then apply current parallel-axis terms through preparedComponents; both paths share tensor/spin consumers. The separate direct path avoids preparation metadata for one-shot calls while this module remains the sole tensor owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No input is clamped or skipped: a non-finite input yields a non-finite tensor that the caller's admission refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in parts. Raw parts and changed prepared intrinsic frames each materialize three rotated-axis vectors and nine moment-times-row products. Scalar shifts/consumers omit displacement vectors, one-part arrays and per-part tensor rows. A populated prepared slot overwrites key/tensor storage on a miss; hits omit intrinsic work. Current shifts and independent off-diagonal association remain.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Direct assembly/spin share the scalar kernel, immutable axes and consumers. Prepare reads each actual moment/quaternion component once; its captured seven-scalar key supplies both Object.is and every intrinsic product. Independent assembly/spin rows become reusable only after all nine entries complete. Current mass/centre/reference shifts, velocity products and model-order sums always run; no target/time/identity key is used.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Direct calls retain no caller data and return fresh rows/vectors. A prepared reader owns at most one seven-scalar key plus nine intrinsic entries per current part for each of assembly and spin; either use truncates both populations when its part array shrinks. The mass-model/interval owner releases the closure with its operation, and no part, pose, query point or result history is held.

## @evidence contracts/development/common.md#meaningful-documentation

States both tensor terms, common frame, SI units, zero-moment parts and caller admission. Namespace prepare returns a callable assembly reader with spin for an actual indexed part; both return fresh values, reject invalid spin indices, compare exact copied intrinsic inputs and release with the owning physical operation.
