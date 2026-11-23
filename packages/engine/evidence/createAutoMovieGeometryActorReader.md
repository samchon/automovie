# src/createAutoMovieGeometryActorReader.ts#createAutoMovieGeometryActorReader

## @evidence contracts/development/implementation.md#principled-implementation

Samples performance-local pose and object channels, resolves root-free FK, then applies pose-root rigid placement and node TRS as separate affine stages; pose-root scale is ignored consistently with resolvePose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One request-local reader shares actor lookup and sampling rules across reach, distance, pose, camera and effect queries; position exposes only the needed root point rather than a lossy composed TRS.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing or multi-shot actors, missing models/motions/bones and out-of-range actor times refuse by name; no file-order winner or fabricated rig is selected.

## @evidence contracts/development/common.md#meaningful-documentation

States shot-local seconds, borrowed records, rigid pose-root semantics and lookup failures; methods describe selectors, exact root positions and pose summaries.

## @evidence contracts/development/implementation.md#efficient-algorithms

Actor lookup scans selected shots and their nodes/models; bone selectors add motion/object-channel sampling and a rig index, with world transforms limited to the selected bone and its ancestors. Pose summaries reuse one spatial sample rather than sampling pose twice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Methods share the supplied shot map but do not memoize mutable poses or channel samples; each requested time is sampled from current records.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned closures borrow the shot map for the reader's lifetime; per-call matches, poses and FK arrays become collectible on return or throw, with no handles or background tasks.
