# src/scene/semanticMask/auditAutoMovieSemanticMaskScene.ts#auditAutoMovieSemanticMaskScene

## @evidence contracts/development/implementation.md#principled-implementation

Builds the same canonical roots and counts scene Mesh objects lacking nearest claimed ownership, reporting drawable entries whose roots never resolve without painting or mutating anything.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pure membership audit shares root/nearest/unresolved laws with the pass, while submission/visibility/pixel coverage remains a renderer/capture responsibility.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ownership-only entries are not falsely counted missing, but existing roots and hidden meshes do not prove pixels; build-time cached coverage becomes stale after relevant graph/design/palette changes.

## @evidence contracts/development/common.md#meaningful-documentation

Documents bidirectional root/mesh membership, ownership-only exceptions, no mutation and the boundary between assembled scene membership and actual rendering.

## @evidence contracts/development/implementation.md#efficient-algorithms

Index/traversal work is O(E+N+M*D) with O(E+R) root/id references and no material, color buffer or pixel allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Hosts may reuse the returned audit only while its graph/design/palette membership is unchanged; this function maintains no cache and equal model names alone are insufficient invalidation evidence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Roots/ids are call-local and returned coverage contains scalar counts/id strings only; all scene objects remain borrowed and no native resource or task is acquired.
