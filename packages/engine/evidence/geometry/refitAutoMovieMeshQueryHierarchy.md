# src/geometry/refitAutoMovieMeshQueryHierarchy.ts#refitAutoMovieMeshQueryHierarchy

## @evidence contracts/development/implementation.md#principled-implementation

Bounding-volume refitting preserves the tree partition and replaces each leaf's geometry, then takes componentwise unions up to the root. These exact unions enclose all replacements independently of how the old partition was chosen, which keeps overlap and distance pruning sound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One internal refit owner separates fixed hierarchy topology from current entry bounds. The crossing geometry owner supplies ordinal-preserving replacements; indexing, admission, candidate sorting and narrow phase stay with their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every leaf entry is replaced once without filtering, area tests, padding, transform approximations or actor policy. Original leaf order remains, and an empty leaf retains the existing infinity/-infinity empty-union bounds.

## @evidence contracts/development/common.md#meaningful-documentation

States admitted replacement premises, common metre frame, identity/population preservation, degenerate entries, independent tree/array ownership, callback entry ownership and empty semantics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits each node once and each of n leaf entries once, with three component unions per entry or branch: O(n) time and O(n) fresh retained tree storage. No sort or median repartition is repeated; an unsuitable old partition can cost more query traversal than a fresh build.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses only the source hierarchy's partition and leaf order, which remain valid for the same entry population. All current bounds come from replacements; no old bounds or point-dependent verdict survives.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Transfers a new tree with two three-number bounds per node and one array per leaf. Recursion uses the existing balanced tree's logarithmic depth, and no source tree, callback or replacement history is retained by this function.
