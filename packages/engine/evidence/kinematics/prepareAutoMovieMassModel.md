# src/kinematics/prepareAutoMovieMassModel.ts#prepareAutoMovieMassModel

## @evidence contracts/development/implementation.md#principled-implementation

Preserves segmental means, actual mass-point/principal placement, parallel-axis tensors and two-pose orbital-plus-spin momentum. The rates wrapper delegates the same immutable model and actual pose/bone-rate snapshot to the shared instantaneous centroidal reducer; it neither replaces interval semantics nor invents a missing derivative.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One opaque token owns the admitted model and bounded scalar prerequisites. Pose/place share readFrame, inertia/between lazily acquire the existing numeric workspace, and nested reads delegate uncached formulas while the outer workspace is active. Release deletes the sole live state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No posed answer, target, time grid or approximate key substitutes for a requested transform. Preparation validates the actual copied numeric snapshot, without rereading source fields after admission. Non-finite properties, negative mass or inertia, zero principal rotations and an inconsistent total mass are refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation and physical reads are O(S) for S segments; bones returns O(U) names and release is one weak deletion. Centre-only balance trials allocate no unused tensor/interval workspace, while all model scalars are still copied/validated at preparation. Private frame/intrinsic storage is reused; public results remain fresh. Place omits unused principal/part records. Unchanged rotations/intrinsic frames/endpoint quaternions omit local/axis/inverse-log-slerp products; current sums/rates still run.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Copied model scalars fix one epoch. ReadFrame captures seven actual position/quaternion coordinates once, uses that tuple for Object.is and the same local products, and commits keys only after point arithmetic finishes. Pure translation leaves rotation keys/products intact. Tensor and interval readers likewise compute from their captured intrinsic/endpoint keys and publish readiness after completion. Mutation and signed zero remain visible; no bone identity, target, grid or momentum answer establishes equivalence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The token owns O(S) copied model, last frames, intrinsic/endpoint prerequisites, one quaternion scratch and one active-call guard, with no query population or depth pool. Finally releases the guard after success or failure; nested uncached pose results copy private inertia before escaping. Release deletes all state, is idempotent, and later readers reject the released token.

## @evidence contracts/development/common.md#meaningful-documentation

States finite SI snapshot admission and release ownership. Namespace bones supplies fresh FK demand, pose ordered parts/centre, place the centre, inertia the composite tensor, between positive-interval momentum, rates same-instant momentum from actual common-frame bone velocities, and release idempotent invalidation. All outputs are independent and rate maps are borrowed synchronously.
