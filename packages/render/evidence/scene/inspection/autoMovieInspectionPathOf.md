# src/index.ts#autoMovieInspectionPathOf

## @evidence contracts/development/common.md#meaningful-documentation

States what forms the path, what the root and an unnamed object contribute, the empty path and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The path is read from the scene graph's own parent links and names, the identity the builders already assign, so no registry of parts exists beside the scene.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One walk up the parent links, collecting names, then a reversal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An object outside the root is refused instead of given the path it has in another graph.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the object's depth.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One walk per call, with nothing computed twice inside it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned string outlives the call.
