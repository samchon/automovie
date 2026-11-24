# src/geometry/construction/AutoMovieSplineCurve.ts#AutoMovieSplineCurve.width

## @evidence contracts/development/implementation.md#principled-implementation

Each coordinate has N controls, so the second block starts at offset N.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The identity layout helper keeps the spline offset convention with its reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not round or validate the supplied count or reinterpret it as harmonic order.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the per-coordinate offset from the 2N-entry complete layout.

## @evidence contracts/development/implementation.md#efficient-algorithms

Returns the count directly in constant time without allocation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This scalar layout identity coordinates no repeated work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number and acquires no state or resource.

# src/geometry/construction/AutoMovieSplineCurve.ts#AutoMovieSplineCurve.evaluate

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the four local uniform periodic cubic basis functions and their analytic first derivative, scaled from control parameter to radians by N/(2pi).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Both coordinate blocks share one wrapped span, basis and support-index calculation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the supplied controls and ordinary periodic wrapping without fitting, finite differences or normalization; positive integer N and complete finite controls are producer premises.

## @evidence contracts/development/common.md#meaningful-documentation

Gives layout, phase periodicity and returned value/derivative units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work reads four controls per coordinate regardless of total N and allocates only the fixed-size result.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Value and derivative components reuse the same four support indices and local parameter; this reader owns no prepared-station cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new four-number tuple without retaining the coefficient array or any query state.

# src/geometry/construction/AutoMovieSplineCurve.ts#AutoMovieSplineCurve.interpolate

## @evidence contracts/development/implementation.md#principled-implementation

Convolves uniformly spaced knot samples with the inverse cubic knot filter, wrapping indices periodically; truncation at distance 32 leaves a geometric coefficient tail rather than an exact symbolic inverse.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One periodic convolution prepares both coordinate blocks with a shared fixed filter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no point-specific corrections; valid ordered knot samples are the caller's premise, and finite filter truncation is explicit.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the knot equation, inverse-filter formula, truncation scale and returned layout.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each of N samples visits 65 fixed filter offsets, giving O(N) time and O(N) output rather than a dense interpolation solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The 33 absolute-distance weights are computed once at module load and reused for every sample and both coordinates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one 2N-entry output; only the fixed 33-number FILTER is process-retained by this path, and no sample input is kept.

# src/geometry/construction/AutoMovieSplineCurve.ts#AutoMovieSplineCurve.jet

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates the same local cubic basis twice, applying N/(2pi) and its square for first and second radian derivatives on admitted periodic controls.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One span reading returns the point and both derivative orders required by surface jets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Computes polynomial derivatives directly without sampled differences or altered controls; valid count/layout and representable scaling remain caller premises.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies derivative ordering, basis second derivatives and the radian chain-rule factors.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work reads eight coordinate controls and returns six numbers, independent of the whole section order.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Loaded controls, support indices and basis powers serve all three derivative orders in the same call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the caller-owned six-number tuple escapes; no coefficient reference or phase cache is retained.

# src/geometry/construction/AutoMovieSplineCurve.ts#AutoMovieSplineCurve.project

## @evidence contracts/development/implementation.md#principled-implementation

Uniform M samples with M a multiple of positive N make the normal matrix circulant; its direct Fourier eigenbasis solves both coordinate right-hand sides, optionally adding the declared second-difference penalty.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Local normal-row/right-hand-side accumulation and one shared Fourier basis keep the ordinary and penalized fits in one solver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects a nonmultiple sample count; count validity, finite data and nonsingular Fourier denominators remain caller premises, and cutoff is explicitly restricted to the implemented frequency range rather than an exact pass-through guarantee.

## @evidence contracts/development/common.md#meaningful-documentation

States uniform phases, normal-matrix structure, cutoff half-response meaning and the limits of the smooth frequency-response claim.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(M+N^2) accumulation/direct transforms and O(N^2) transform tables avoid a dense O(N^3) solve; the implementation does not use an FFT and is not claimed optimal for unbounded N.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Within a fit both coordinates and the normal matrix share one turn table, computed once for that fit; nothing is kept across fits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The two N-by-N turn tables, the O(N) solve arrays and the 2N output have call/result lifetimes; the fit retains nothing in module state.
