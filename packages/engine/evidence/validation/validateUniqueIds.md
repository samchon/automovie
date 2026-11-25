# src/validation/validateUniqueIds.ts#validateUniqueIds

## @evidence contracts/development/implementation.md#principled-implementation

Enumerate record ids/paths before validateUniqueBy checks duplicates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uniqueness delegates to its canonical owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ids are compared exactly as declared; no id is repaired.

## @evidence contracts/development/common.md#meaningful-documentation

Exact element id suffixes identify duplicates without resolving a registry.

## @evidence contracts/development/implementation.md#efficient-algorithms

N rows require mapping plus expected set work and proportional temporary row storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The common uniqueness owner supplies the same duplicate policy for all artifacts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only diagnostics escape; temporary mapped rows/set storage release without a host registry.
