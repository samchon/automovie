# src/AutoMovieFrameGrid.ts#AutoMovieFrameGrid.last

## @evidence contracts/development/common.md#meaningful-documentation

Defines the units, index origin, and the final frame's relation to the regular cadence.

## @evidence contracts/development/implementation.md#principled-implementation

Compares the candidate's canonical timestamp to the end since the product alone can round across an integer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Computes one candidate, then advances it if its timestamp is still before the end.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps a fractional end distinct from the regular frame immediately before it without an arbitrary epsilon.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time and space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Computes one candidate and its time.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state.

# src/AutoMovieFrameGrid.ts#AutoMovieFrameGrid.time

## @evidence contracts/development/common.md#meaningful-documentation

Defines the index origin, input and return units, and the end clamp.

## @evidence contracts/development/implementation.md#principled-implementation

One division yields the canonical timestamp without accumulating rounding error.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Divides the index by the rate and clamps the result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns the exact end when the next regular frame would run past it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time and space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Computes one timestamp.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state.

# src/AutoMovieFrameGrid.ts#AutoMovieFrameGrid.nearest

## @evidence contracts/development/common.md#meaningful-documentation

Defines the rounding policy, the exact end, and the units of the supplied clock.

## @evidence contracts/development/implementation.md#principled-implementation

Rounds within the regular grid and reserves the end index for the actual end, so it remains a separate scrubber position.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns the last index at the end and otherwise rounds and caps the regular index.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A playhead just before the end cannot occupy the end index.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time and space.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the last frame number already computed for the grid.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state.
