# src/measureAutoMovieGeometry.ts#measureAutoMovieGeometry

## @evidence contracts/development/implementation.md#principled-implementation

Dispatches the discriminated query to distance, reach, ground, formation, effect, film-time, pose or camera measurement; numerical queries inspect records rather than render pixels, and callers establish freshness.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The switch owns query selection while separate helpers own admission and measurement for each query, keeping terrain and actor resolution shared.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No consumer identity changes an answer; camera answers explicitly report occlusionMeasured=false and effect visibility risk is an analytic proxy rather than pixel occlusion.

## @evidence contracts/development/common.md#meaningful-documentation

States freshness responsibility, supported record-only measurements and correction-bearing failure; each helper documents its numeric frame and limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Only the selected branch runs; its actor, bone, formation, particle or timeline dimensions determine cost, with no full-project rebuild or rendering.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every call reads the supplied snapshots; no cached answer can outlive mutable design or compiled input.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned measurement values belong to the caller; the dispatcher retains no maps, handles or tasks after return or throw.
