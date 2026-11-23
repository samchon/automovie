# src/geometry/construction/probeAutoMovieSolidMesh.ts#probeAutoMovieSolidMesh

## @evidence contracts/development/implementation.md#principled-implementation

Floating edge clearance proposes a nearby point; exact represented-point orientation and the empty-triangle witness verify connection to the requested boundary side before membership is read. Any edge of a face cycle bounds the same face, so trying the next edge does not change which face is read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Probe construction is one responsibility shared by component classification; the witness owns exact partition checks and Plan owns membership.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not call approximate distance an exact bound. At most 64 smaller proposals are attempted per edge; unrepresentable cover arithmetic returns an explicit failure, and a walk none of whose edges admits a corridor returns the named failure, not an empty region.

## @evidence contracts/development/common.md#meaningful-documentation

States represented-number corridor meaning, face-cycle premise, one-period primitive premise and finite search/precision failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans S segments for a proposal and at most 64 witnesses with O(V+S) exact-predicate work each, per edge tried; the first edge serves every walk that is not degenerate there.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares original indexed endpoints, one edge length and the proposed clearance across attempts on one edge; source membership remains with Plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Probe, local image arrays and witness scratch expire on return; no source map, callback or cache is retained.
