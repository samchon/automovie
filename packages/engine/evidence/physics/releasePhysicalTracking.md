# src/physics/releasePhysicalTracking.ts#releasePhysicalTracking

## @evidence contracts/development/common.md#meaningful-documentation

States what is cleared, what is kept and the caller's obligation.

## @evidence contracts/development/implementation.md#principled-implementation

Zero-strength motor commands leave only the axes' passive damping; the released set makes the withdrawal happen once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the segments and one over the joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every segment and joint of the body is released.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the body's segments and joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call acts on the current world.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the released set it updates.
