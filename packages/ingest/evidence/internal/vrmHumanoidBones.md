# src/internal/vrmHumanoidBones.ts#vrmHumanoidBones

## @evidence contracts/development/implementation.md#principled-implementation

VRMC_vrm uses named 1.0 slots and valid node indices; VRM 0.x maps renamed thumb slots and rejects duplicates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Version branching, thumb migration and the closed humanoid vocabulary stay with this metadata owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown or dangling mappings throw; VRMC_vrm beta thumb conventions remain an explicit unresolved interpretation limit.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states metadata version branching, node references, ordering and unsupported beta interpretation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work follows mapping entries and name text; 1.0 metadata enumerates B keys before O(B log B) prefix-scanning comparisons, while 0.x uses expected constant-time slot lookups after name admission.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each metadata mapping is resolved once during its inspector call; mutable documents prevent persistent equivalence caching.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Result slot records scale with declared mappings; temporary entries and uniqueness sets die on return or throw.
