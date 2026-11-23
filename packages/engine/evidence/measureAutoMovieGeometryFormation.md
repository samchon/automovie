# src/measureAutoMovieGeometryFormation.ts#measureAutoMovieGeometryFormation

## @evidence contracts/development/implementation.md#principled-implementation

Requires matching counts/digests and nonempty chunks in every participating shot, samples unit/member motion, checks three unique representative slots per chunk, and uses camera frustum spheres expanded by measured model radius. Ground results are representative rather than exhaustive.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The branch owns participation and summary aggregation while shared formation placement, LOD, terrain and camera helpers keep the same geometry as rendering consumers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No arbitrary missing runtime or camera is synthesized; route clearance is explicitly zero without routes. Radius includes the existing 0.01 minimum chunk-centre sphere plus runtime model expansion, and pixel projection clamps depth to 0.001 consistently with this analytic estimate.

## @evidence contracts/development/common.md#meaningful-documentation

States sampled-time, representative-ground and analytic visibility limits; output exposes counts, bounds, pixel ranges, LOD populations and compiled digest.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans participating contracts/runtimes, routes, chunks and heroes; representative slots are at most three per chunk. AABB farthest-corner radius uses axis extrema, and range aggregation avoids argument spreading or extra distance/pixel arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One sampled unit motion, resolved camera and per-chunk measurement serve all summary fields and LOD counts; no cross-call cache assumes compiled snapshots stay unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary slot sets and chunk measurements scale with chunk count and are released after return/throw; returned fields contain scalars and the existing digest, with no renderer handles.
