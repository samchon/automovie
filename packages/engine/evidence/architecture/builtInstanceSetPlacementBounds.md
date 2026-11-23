# src/architecture/builtInstanceSetPlacementBounds.ts#builtInstanceSetPlacementBounds

## @evidence contracts/development/implementation.md#principled-implementation

Uses occupied grid/lattice hull slots, a scatter disk envelope and transformed prototype-box corners. Fixed rotations preserve the stated box envelope; variable rotations use an origin-centred enclosing sphere. Scatter and variation envelopes can exceed the realized seeded members, and prototype boxes can exceed mesh geometry; binary64 evaluation is not an outward-rounded enclosure proof.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The fold handles one population per call: validation is delegated to `validateBuiltPopulation`, shared with `validateBuiltEnvironment`, and the point fold to `builtPointBounds`, so this file keeps only the placement law it bounds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the placement law instead of materializing seeded members, and names no set or layout instance; the `along-route` refusal is the contract's statement that a building cannot reach a world route.

## @evidence contracts/development/common.md#meaningful-documentation

States each envelope law, the seeded-member and numerical limitations, the distinction between validating all stored explicit transforms and folding only count, visibility treatment, error types and paths, and the world frame and metre unit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compact grid, lattice and scatter corner folds are independent of count. An explicit layout validates all T stored transforms, then folds eight corners for each of the first count transforms, costing O(T + count) time and O(count) temporary corner storage, plus any violation records produced by validation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call bounds one population from its own record; the record is the caller's mutable data, so a cached box could not prove it still matches.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Compact layouts allocate a bounded corner set; explicit layouts allocate O(count) transformed corners and validation can collect O(T) findings. These temporaries and the collector become unreachable on return or throw; only the returned box escapes.
