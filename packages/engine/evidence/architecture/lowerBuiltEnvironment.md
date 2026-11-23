# src/architecture/lowerBuiltEnvironment.ts#lowerBuiltEnvironment

## @evidence contracts/development/implementation.md#principled-implementation

Validates first, including finite world-TRS representability of authored operating configurations, then decomposes the shared current-state world matrices with normalized rotations. Validation permits its stated round-trip tolerance, so lowering is not an exact-arithmetic inverse for arbitrary sheared matrices.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Lowering only maps an accepted record onto contribution fields; staging is owned by `builtEnvironmentWorldMatrices` instead of a private copy, and populations pass through as their own set records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no building, element or space; the omitted `instanceSets` key is the contribution contract's way of saying "none", kept so a population-free record merges unchanged rather than to satisfy a fixture.

## @evidence contracts/development/common.md#meaningful-documentation

States the world flattening, the applied operating state, why populations stay compact, the id formats, the orders of set pieces, surfaces and walkable ids, the shared objects, the omitted key, and the thrown refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays full `validateBuiltEnvironment` cost, including Cartesian products of interacting operation states and its geometry checks, then one world-staging pass and linear contribution mapping/grouping. Validation is not a linear pass in the record size; the final stage-space grouping is linear in spaces, surfaces and walkable ids.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Lowers one record per call from the caller's mutable data; nothing is cached because no key could prove an earlier lowering still matches the record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the staged matrices and the per-space groupings only for the call; the caller owns the returned contribution, which shares the record's own models, surfaces and population sets.
