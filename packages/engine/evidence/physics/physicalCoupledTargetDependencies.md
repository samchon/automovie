# src/physics/physicalCoupledTargetDependencies.ts#physicalCoupledTargetDependencies

## @evidence contracts/development/common.md#meaningful-documentation

Names the adjusted receiver and reciprocal reachability conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Finds free selected joints in receiver ancestry, then checks reachability in both graph directions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Dependency selection and the two graph traversals use the same admitted bodies and bindings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Skips inactive, self and fixed-receiver edges. A root-only apparent loop cannot pass.

## @evidence contracts/development/implementation.md#efficient-algorithms

Indexes joints by child once and visits each reachable vertex and its edges at most once per direction.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses each body's child index for all of its receiver queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Graphs and pose indexing remain local to this admission check.
