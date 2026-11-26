# src/geometry/construction/AutoMovieLoftPoint.ts#AutoMovieLoftPoint.sampler

## @evidence contracts/development/implementation.md#principled-implementation

Reads a validated original cap directly, or the station's explicit local field/legacy basis with its actual frame/lift/relief owners; the original collapsed tip supplies only its actual phase-constant value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prepared value sampler serves many phases without rebuilding its station data.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the existing phase, lift-normal and relief arithmetic; actual source fields are validated by their owning readers.

## @evidence contracts/development/common.md#meaningful-documentation

States station/phase units, borrowed immutable chain data and caller-owned returned vectors.

## @evidence contracts/development/implementation.md#efficient-algorithms

Native source validation/scalar lookup and fixed geometry, or O(N) legacy coefficients, are prepared once; a native phase uses one numeric inverse, while lift keeps its existing basis support.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the station's frame and prepared arrays across every requested phase.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned closure retains the immutable chain, including its source owners, and one station's prepared arrays/frame until its caller releases it; no cache is added here.

# src/geometry/construction/AutoMovieLoftPoint.ts#AutoMovieLoftPoint.point

## @evidence contracts/development/implementation.md#principled-implementation

Reuses a station sampler under the immutable chain identity; spline controls are combined lazily with the same explicit coefficient interpolation as the eager reader.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The original eight-insertion sampler cache owns single-point reuse in this one module.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves legacy arithmetic, nonpromoting hits, insertion/eviction and fresh vectors; explicit native data alone selects the actual field and raw phases reach its own wrapping owner.

## @evidence contracts/development/common.md#meaningful-documentation

States immutable chain/cache equivalence and station-mm/phase-radian units; only explicit surviving original ends authorize cap values beyond principal rows.

## @evidence contracts/development/implementation.md#efficient-algorithms

Native misses use the value-only source sampler including validation/scalar lookup; source-absent spline misses retain O(N) holey rows/bitmap and at most four new control combinations per phase.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the same last eight inserted station preparations without promoting hits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A weak chain key owns at most eight O(N) sampler records; eviction releases a record and returned points are fresh.

# src/geometry/construction/AutoMovieLoftPoint.ts#AutoMovieLoftPoint.phaseSampler

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same explicit local field or legacy basis as sampler, its frame value and the actual lift/relief phase derivatives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One caller-owned station closure serves numerical-station normal consumers independently of analytic station jets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No missing physical derivative is inferred and neither eight-station module cache receives this plan.

## @evidence contracts/development/common.md#meaningful-documentation

Returns fresh world p/t in mm and mm per radian on regular rows or validated original caps; a collapsed original tip is phase-constant but has no asserted physical station jet.

## @evidence contracts/development/implementation.md#efficient-algorithms

One local value/frame/lift preparation precedes each fixed native inverse or existing basis phase lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The closure shares its prepared station geometry, frame and lift across phases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller alone retains this plan until release; every result owns fresh vectors and no new module cache exists.
