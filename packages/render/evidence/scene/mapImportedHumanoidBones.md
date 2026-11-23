# src/index.ts#mapImportedHumanoidBones

## @evidence contracts/development/implementation.md#principled-implementation

Matches normalized requested slots before the existing importer aliases and keeps the first traversed node for each requested bone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Name normalization and the fixed alias table remain local to imported-rig mapping, separate from proxy construction and animation retargeting.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The normalized-slot Map preserves Array.find's first requested slot and original node traversal precedence; no expected rig or consumer receives a special mapping.

## @evidence contracts/development/common.md#meaningful-documentation

Documentation identifies accepted VRM/Blender/Mixamo/Unreal naming, requested-slot restriction and first-node precedence without claiming observed rig appearance.

## @evidence contracts/development/implementation.md#efficient-algorithms

S slot names normalize once and N node names normalize once, yielding expected O(S+N) lookups plus name bytes and O(S) maps instead of repeating normalization for each node.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Normalized requested-slot equivalence is shared within one traversal; the current loaded object tree is reread each call and no map survives across a changed rig.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only matched node references escape in the result, keeping those borrowed nodes reachable; temporary name/slot maps leave the call and no skeleton or GPU resource is acquired.
