# src/architecture/validateBuiltBuildings.ts#validateBuiltBuildings

## @evidence contracts/development/implementation.md#principled-implementation

Ownership is total when every hierarchy root is a declared unit root and every record's parent chain ends at a root, so each record walks its chain to the top with a visited set that stops on a cycle; root lookups go through id maps built once.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The building-unit section of `validateBuiltEnvironment`, separated so that file stays one orchestration; element and space ownership share one private walk because both hierarchies follow the same rule.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No unit, element or space is special-cased; a dangling or cyclic parent is skipped only because its own check already names it, as documented.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states every unit rule, the ownership rule and how a gap is reported, why broken chains are skipped, and the paths used.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in units plus the summed parent-chain length of every element and space, which is O(n·d) for hierarchy depth d; id lookups are hash probes instead of the per-unit linear searches they replaced.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per building validation; nothing is shared across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The id maps, root sets and per-record visited sets are local and released on return, each bounded by the record count.
