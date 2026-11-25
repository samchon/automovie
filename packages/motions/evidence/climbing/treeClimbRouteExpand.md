# src/climbing/treeClimbRouteExpand.ts#treeClimbRouteExpand

## @evidence contracts/development/common.md#meaningful-documentation

States the expansion, the load share and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Additions first, then the feet's moves, then the hands', then removals, each group one stance, so the contact count stays at its highest between stances; each contact bears the weight over the count.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the stances, one over each change.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An overloaded branch refuses; no hold is dropped to pass.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the stances times the parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the staged points for the plan.
