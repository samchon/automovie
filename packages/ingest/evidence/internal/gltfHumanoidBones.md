# src/internal/gltfHumanoidBones.ts#gltfHumanoidBones

## @evidence contracts/development/implementation.md#principled-implementation

Skin joint indices define eligible nodes and normalized aliases assign at most one source-order node per semantic slot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Skin membership and slot claiming stay here while the shared name helper owns this importer's supported naming vocabulary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unrecognized names and repeated slots remain unmapped instead of overwriting first ownership or inferring missing anatomy.

## @evidence contracts/development/common.md#meaningful-documentation

Comments state node-order first claim, skin-only eligibility and the distinction from actual weight coverage.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work follows skins, their joint entries, nodes and eligible node-name text, with expected constant-time membership and slot lookups.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each eligible node name is resolved once; the inspector separately shares mesh/skin weight checks.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary membership sets die with the call; returned slot records are bounded by the recognized humanoid vocabulary.
