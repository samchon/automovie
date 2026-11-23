# src/scene/slotMatrix.ts#slotMatrix

## @evidence contracts/development/implementation.md#principled-implementation

Delegates world-to-anchor/spacing offset to the existing owner, converts the slot degree heading around Y and composes unchanged unit scale into one group-local matrix.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Engine placement/spacing and Three matrix projection remain separate, preserving root position rather than moving it to compensate for layout.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No viewer layout copy or yaw fallback replaces canonical slot values; admitted finite metre/degree inputs and spacing semantics remain producer premises.

## @evidence contracts/development/common.md#meaningful-documentation

Documents world versus group-local coordinates, metres, authored degrees and base-facing spacing frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Offset projection plus fixed vector/quaternion/matrix composition is constant work per slot without traversing the formation population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The current slot/anchor/spacing/baseFacing determine each matrix; the shared offset law avoids a divergent cached viewer derivation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only one returned Matrix4 and fixed scratch vectors/quaternion are owned, with no instance buffer, mesh or native resource acquired.
