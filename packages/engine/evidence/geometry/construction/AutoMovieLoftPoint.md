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

The returned closure retains the immutable chain and one station's prepared arrays, frame and optional original point reader until its caller releases it.

# src/geometry/construction/AutoMovieLoftPoint.ts#AutoMovieLoftPoint.point

## @evidence contracts/development/implementation.md#principled-implementation

Spline controls are combined on demand with the same coefficient interpolation as the dense sampler.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same station geometry serves direct point and fixed-station sampler entry points.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves legacy arithmetic, nonpromoting hits, insertion/eviction and fresh vectors; explicit native data alone selects the actual field and raw phases reach its own wrapping owner.

## @evidence contracts/development/common.md#meaningful-documentation

States station-mm/phase-radian units. Explicit surviving original ends authorize cap values beyond principal rows.

## @evidence contracts/development/implementation.md#efficient-algorithms

Native misses use the value-only source sampler including validation/scalar lookup; source-absent spline misses retain O(N) holey rows/bitmap and at most four new control combinations per phase.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed-station consumers call sampler once for their full phase sweep. Sparse queries combine only their active controls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The station plan lives for the direct call. Its result owns a fresh world point.

# src/geometry/construction/AutoMovieLoftPoint.ts#AutoMovieLoftPoint.phaseSampler

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same explicit local field or legacy basis as sampler, its frame value and the actual lift/relief phase derivatives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One caller-owned station closure serves numerical-station normal consumers independently of analytic station jets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Physical2 is independently available through the jet reader.

## @evidence contracts/development/common.md#meaningful-documentation

Returns fresh world p/t in mm and mm per radian on regular rows or validated original caps; a collapsed original tip is phase-constant but has no asserted physical station jet.

## @evidence contracts/development/implementation.md#efficient-algorithms

One local value/frame/lift preparation precedes each fixed native inverse or existing basis phase lookup.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The closure shares its prepared station geometry, frame and lift across phases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller alone retains this plan until release; every result owns fresh vectors and no new module cache exists.
# src/geometry/construction/AutoMovieLoftPoint.ts#AutoMovieLoftPoint.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Uses the current chain scope's admitted original section and cap readers, and the existing legacy interpolation otherwise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One station factory selects between sparse spline controls and the dense sampler when the caller declares a phase sweep.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Explicit cap and original-source ownership remain authoritative for native point values.

## @evidence contracts/development/common.md#meaningful-documentation

Documents Point0 and immutable chain preparation. The dense mode prepares all legacy controls for phase sweeps.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain lift-presence query supports sparse legacy work. A phase reads only four controls per coordinate on that path.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each station's sampler shares section, frame and lift work across its phases.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the station factory and the lifetime of individual station readers.
