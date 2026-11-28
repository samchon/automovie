# src/geometry/IAutoMovieRefineContourInteractions64.ts#IAutoMovieRefineContourInteractions64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result describes qualification in a chosen projection plus contact history and actual work counts.

## @evidence contracts/development/design.md#principled-representation

The owner chooses a projection from the first selected ring and computes exact orientation in that projection. For finite disjoint tiny XZ squares a binary64 normal can underflow, choose the wrong dropped coordinate and leave projected contact unresolved.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result reports actual work and unresolved projected chords. Original source topology, final strip acceptance and global embedding remain separate.

# src/geometry/IAutoMovieRefineContourInteractions64.ts#IAutoMovieRefineContourInteractions64.IResult.qualified

## @evidence contracts/development/common.md#meaningful-documentation

True indicates no unresolved represented contact in the chosen projection. A resolved contact can still leave diagnostic history.

# src/geometry/IAutoMovieRefineContourInteractions64.ts#IAutoMovieRefineContourInteractions64.IResult.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

The trace records encountered contact, successful separation or unresolved reasons in observed order.

# src/geometry/IAutoMovieRefineContourInteractions64.ts#IAutoMovieRefineContourInteractions64.IResult.refinements

## @evidence contracts/development/common.md#meaningful-documentation

The count increments for each retained source split that is registered and spliced into a ring.

# src/geometry/IAutoMovieRefineContourInteractions64.ts#IAutoMovieRefineContourInteractions64.IResult.chordPairs

## @evidence contracts/development/common.md#meaningful-documentation

The count includes every visited candidate pair, even those filtered by boxes or revisited after refinement.

# src/geometry/IAutoMovieRefineContourInteractions64.ts#IAutoMovieRefineContourInteractions64.IResult.exactOrientationTests

## @evidence contracts/development/common.md#meaningful-documentation

The count increments when the exact dyadic orientation predicate runs.

# src/geometry/IAutoMovieRefineContourInteractions64.ts#IAutoMovieRefineContourInteractions64.IResult.elapsedMs

## @evidence contracts/development/common.md#meaningful-documentation

The duration is measured only when requested, including a no-work invocation. It is null otherwise.
