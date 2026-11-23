# src/scene/semanticMask/unresolvedOf.ts#unresolvedOf

## @evidence contracts/development/implementation.md#principled-implementation

Collects ids actually present in roots and filters palette entries that claim nodes or an instance-set root but have no resolved object id.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Drawable-root absence classification stays separate from ownership-only entries, scene traversal and actual pixel coverage.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ownership-only chains do not become false missing drawables; result order follows the already-ordered palette and root presence is not rendered visibility proof.

## @evidence contracts/development/common.md#meaningful-documentation

Documents drawable criteria, instance-set exception, input ordering and borrowed roots/palette.

## @evidence contracts/development/implementation.md#efficient-algorithms

R roots and E entries are scanned once through a Set, O(R+E) with proportional id references/result strings and no nested root search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Resolved-id membership is shared for one filtering call, while changed roots/palette requires reevaluation and no cross-call memo exists.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only call-local id Set and returned id list are owned; no scene object, material or native resource is acquired.
