# src/geometry/sweep/checkAutoMovieSweepFeature.ts#checkAutoMovieSweepFeature

## @evidence contracts/development/implementation.md#principled-implementation

Checks the feature's declared domain and the mutually exclusive radius and offset modes before compilation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One validation pass owned by the sweep compiler.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid values are refused rather than reordered, clamped or defaulted.

## @evidence contracts/development/common.md#meaningful-documentation

States the unchanged input and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P) for P feature points, with no retained arrays.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single validation pass per sweep compile.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state or resources.
