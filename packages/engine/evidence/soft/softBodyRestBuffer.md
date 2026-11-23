# src/soft/softBodyRestBuffer.ts#softBodyRestBuffer

## @evidence contracts/development/implementation.md#principled-implementation

Named anchor poses override explicit anchor positions, which override the particle's authored rest triple. A missing named state throws; validated domains provide in-range particle indices and dense coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validation's plain rest-configuration result and both simulation wrappers use one target-resolution owner, while only the simulation mutates the returned typed buffer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An ungated out-of-range typed-array write is not promoted into an invented particle; this function does not replace domain admission or moving-boundary resolution.

## @evidence contracts/development/common.md#meaningful-documentation

States target precedence, named-state refusal and the typed buffer's ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P coordinates, A anchors, S states and T selected-state poses, copying and application cost O(P+A+S+T), with O(P+T) temporary/result storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Named targets are indexed once per call and reused across anchors; mutable domains and selected states are not treated as cross-call equivalents.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The pose map is local, target references are read only, and the fresh Float64Array transfers to its consumer without retaining the domain.
