# src/soft/softBodyNeighbourOf.ts#softBodyNeighbourOf

## @evidence contracts/development/implementation.md#principled-implementation

Column/row offsets are taken from the canonical twelve-entry table and checked against rectangular dimensions before constructing the row-major index; callers supply admitted integer dimensions and a table index.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same indexing owner serves rest-edge setup, strain measurement and Jacobi gathers, so boundary exclusion cannot drift between phases.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The -1 result is the lattice's explicit absent-neighbour sentinel, not a replacement particle or geometric coordinate.

## @evidence contracts/development/common.md#meaningful-documentation

States rectangular admission premises and the absent-neighbour result.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed table read and four boundary comparisons take constant time and space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All solver phases share the same table and calculation; there is no per-particle cache whose validity could diverge from dimensions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only an integer is returned; the immutable offset table belongs to the module and no caller records are retained.
