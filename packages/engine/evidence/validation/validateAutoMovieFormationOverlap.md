# src/validation/validateAutoMovieFormationOverlap.ts#validateAutoMovieFormationOverlap

## @evidence contracts/development/implementation.md#principled-implementation

Place sampled members in a spatial grid and compare same-unit and cross-unit distances against height-overlapping runtime columns across every LOD pair.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

autoMovieModelColumns owns occupied proxy dimensions and placeFormationSlot owns cue-aware placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the first 4096 slots and sampled times are checked. Primitive-core columns omit unsupported geometry, nonunit ancestral scales, nonisometric axial rotations and unrepresentable outer envelopes. Exact binary64 gain equality can omit mathematically unit rotations; GPU Float32 narrowing and animated deformation also remain outside this sampled rest-geometry gate.

## @evidence contracts/development/common.md#meaningful-documentation

Removed members are omitted, tier-pair minimum clearance is used, and unsupported/missing columns are not guessed.

## @evidence contracts/development/implementation.md#efficient-algorithms

M models build the runtime index; each referenced runtime's B bones and P parts incur O(B^2+P) column measurement once per call. T times place at most 4096 members per unit; local density can cause quadratic pair checks traversing tier/column pairs, while cue sampling scans current cue lists.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A lazy request-local runtime-id map shares pure column measurement through the current runtime table; member points still use identity WeakMap caching with an unchanged-placement premise. A found row suppresses later unit-pair checks, while unsuccessful clearance computations are not cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Live formation identities retain bounded member arrays; the M-entry runtime index, referenced-runtime column arrays and unit wrappers are call-local. Per-time grids release after sampling and at most quadratic unit-pair findings remain during the call, with no native collision world acquired.
