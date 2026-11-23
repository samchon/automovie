# src/index.ts#isAutoMovieExternalModelIngestProfile

## @evidence contracts/development/implementation.md#principled-implementation

Exact membership in the four-element frozen registry-derived list admits only supported profile literals, including no inherited object names.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The byte inspector delegates profile admission to this guard, which consumes the single frozen list derived from the closed typed registry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The guard does no trimming or case folding, so a near-miss spelling is refused rather than accepted.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the intended untyped inputs, the exact-match rule, and the inherited-name refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One type check and at most four literal comparisons per call require constant time without allocating another profile inventory.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A constant-time check has nothing worth reusing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The guard retains nothing and reads a module constant.
