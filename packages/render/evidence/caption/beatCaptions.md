# src/caption/beatCaptions.ts#beatCaptions

## @evidence contracts/development/implementation.md#principled-implementation

An adjacency map from parent id to children turns the parent-pointer node list into a tree the walk visits once per reachable node, and the slug is passed down as a parameter so a scene's slug scopes exactly its subtree; the walk relies on commit validation's acyclic, unique-id tree, without which a node whose id equals its own parent would recurse forever.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function builds the adjacency map and the index together because no other caption consumer needs the adjacency; the scene slug comes from `screenplaySceneSlug` so the caption label and the screenplay heading cannot diverge, and the same parent-map walk is written again in `renderScreenplay`, a duplication this function does not own.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both null and absent `tree` values are the interface's documented treeless states, not a fixture case, and the function never repairs an invalid tree; it leaves rejection to commit validation.

## @evidence contracts/development/common.md#meaningful-documentation

The doc names the consumer and key, the walk order and slug inheritance, what a treeless script yields, and what happens to an unreachable node or a repeated beat id.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time and space are linear in the node count N: one pass builds the adjacency map and the walk visits each reachable node once with a constant-time slug format per scene, which is the minimum for reading every beat.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The function computes one fresh index per call for one script and coordinates no phases; `planCaptionSidecar` calls it once per plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The adjacency map is local and released on return, and the returned map, owned by the caller, holds one record per distinct beat id, bounded by the tree's beat count; recursion depth is bounded by the tree's depth.
