# src/production/IAutoMovieResolveBeatProps.ts#IAutoMovieResolveBeatProps

## @evidence contracts/development/design.md#principled-representation

The shared `resolveBeatSnapshot` indexes motions by id and performances, mounts and plants by node in maps, refusing a duplicate key with a thrown error that names its position, so every actor resolves against exactly one source instead of the first or last match.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record shared by both snapshots and the film linter, because all three read the same compiled facts and differ only in the instant they sample; the optional members carry the forward state that a later beat resumes from.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing mounts or plants mean none rather than a guessed coupling or stance, and nothing in the record is recomputed or repaired by the snapshot functions.

## @evidence contracts/development/common.md#meaningful-documentation

States the two snapshot readers and their instants, the linter's use and order, the builder, the duplicate-key failure, and for each member its source and what omitting it means.
