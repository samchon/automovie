# src/architecture/builtEnvironmentSpaceSurfaces.ts#builtEnvironmentSpaceSurfaces

## @evidence contracts/development/implementation.md#principled-implementation

A filter over each patch's owning `space` against the subtree `builtSpaceSubtree` folds, with walkability read from the record's own `walkable` id list, so support and walkability stay two authored facts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The id lookup and the subtree fold are the shared `requireBuiltSpace` and `builtSpaceSubtree`, so this query owns only the patch filter and the walkable flag.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space or surface and infers nothing from geometry; a patch is walkable only when the record lists its id.

## @evidence contracts/development/common.md#meaningful-documentation

States why support and walkability are separate, what each entry field means including a descendant owner, the order, and the thrown refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the space, surface and walkable counts: one subtree walk, one set built from the walkable ids, and one filtered pass over the patches.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A synchronous read of one record per call; the walkable set is rebuilt from the record each time because the record may have changed between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the subtree and walkable sets only for the call; the caller owns the returned entries.
