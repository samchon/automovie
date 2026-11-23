# src/internal/index.ts#createContractDirectory

## @evidence contracts/development/implementation.md#principled-implementation

The scaffold's ownership rule, bundled shared contracts in the skills tree's `contracts/story` and adopted work/language contracts in the production's `docs/contracts`, maps each family to one tree, joined from the layout constants by `path.join`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the family-to-owner decision for every existence probe and, through createContractRoot, every contract reference root, so no caller rebuilds either tree from the location.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No family falls back to another tree when a file is missing, and the retired `.agents/skills/contracts/story/{work,language}` location is never consulted; a missing contract stays missing where its owner keeps it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One branch and one path join, linear in the path length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure path computation coordinates no work across requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned string outlives the call.

## @evidence contracts/development/common.md#meaningful-documentation

States which tree owns each family in workspace and standalone layouts, and that the result stops above the family folder.
