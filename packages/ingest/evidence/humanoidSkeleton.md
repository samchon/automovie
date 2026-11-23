# src/humanoidSkeleton.ts#humanoidSkeleton

## @evidence contracts/development/implementation.md#principled-implementation

Slots come from a normalized alias table, the hierarchy from a child-to-parent map walked to the nearest mapped ancestor and refusing an ancestor met twice, since a glTF hierarchy is a forest of strict trees, and each rest from composing skipped helper TRS with `composeLocalTransform`; that composition drops the shear a non-uniform helper scale under a rotated child would need, the limitation the documentation states.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function owns slot claiming and hierarchy rebuilding, while name normalization and transform composition live in internal modules the byte inspector and motion adoption share, so the alias table and the composition formula each exist once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The alias table is this importer's declared naming vocabulary, not proof of bone anatomy; the table is a `Map`, so a joint named after an `Object.prototype` member such as `constructor` maps to nothing instead of an inherited function, and first-claim order is the documented rule for duplicate slots.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the every-skin first-claim rule and its reason, the covered naming conventions and unmapped fingers, eyes and jaw, the helper composition and its exactness, the root-bone exception, the null cases, the refused ancestor cycle, and that constraints are left empty.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work follows skins and joints, joint-name text normalization, nodes and child links, and each mapped bone's walk to the nearest mapped ancestor; hash lookups have expected constant cost, while each helper walk may revisit ancestors another bone's walk read, and reads each node at most once itself.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Slot and parent maps are call-local; repeated ancestor walks remain bounded by mapped slots and document depth, while mutable Document contents and the requested skeleton id preclude a retained identity-only cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The slot and parent maps, the helper arrays and each walk's visited set are local and released on return or throw; the returned skeleton holds new transform objects proportional to the mapped bones, at most the humanoid slot count, owned by the caller.
