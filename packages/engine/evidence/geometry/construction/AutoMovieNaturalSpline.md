# src/geometry/construction/AutoMovieNaturalSpline.ts#AutoMovieNaturalSpline.create

## @evidence contracts/development/implementation.md#principled-implementation

Thomas elimination solves the natural cubic's tridiagonal curvature equations, with zero endpoint curvatures; finite increasing knots and matching values are required by callers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Preparation returns the original knot/value arrays with one solved curvature array for both readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not merge repeated knots or clamp values; it performs no independent admission, so zero gaps and ill-scaled arithmetic are outside its stated premise.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the knot order/count premise, natural end condition and borrowed-array ownership through ISpline.

## @evidence contracts/development/implementation.md#efficient-algorithms

A forward elimination and back substitution use O(N) time and O(N) temporary/output storage instead of a dense solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Computes curvatures once for all later readings of the returned spline; no key-based sharing or mutation invalidation is attempted.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Diagonal, upper and right arrays are call-local; the returned record retains the input arrays and curvature array for its owner's lifetime.

# src/geometry/construction/AutoMovieNaturalSpline.ts#AutoMovieNaturalSpline.evaluate

## @evidence contracts/development/implementation.md#principled-implementation

Reads the cubic determined by adjacent values and curvatures, and explicitly extends the first/last tangent outside the knot range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lower-bound interval lookup and the shared value polynomial serve interpolation and both tangent extensions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Extrapolation is a declared linear extension, not a claim that the boundary cubic stays linear outside its interval; inputs are not clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States the outside-range rule; ISpline specifies increasing unchanged knots and matching prepared curvatures.

## @evidence contracts/development/implementation.md#efficient-algorithms

Binary lookup is O(log N), followed by constant scalar arithmetic; value-only queries allocate no derivative tuple or search index.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the prepared knot curvatures and reads only one interval's coefficients; repeated query locations are not cached.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains no input, buffer or handle.

# src/geometry/construction/AutoMovieNaturalSpline.ts#AutoMovieNaturalSpline.derivative

## @evidence contracts/development/implementation.md#principled-implementation

Analytically differentiates the same natural cubic as evaluate; the explicit tangent extension has its endpoint slope and zero second derivative.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns the two derivative orders together after one interval lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses exact polynomial derivatives rather than finite differences; the local parameter clamp implements the documented exterior tangent.

## @evidence contracts/development/common.md#meaningful-documentation

Gives derivative formulas, tuple order and the outside-knot behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(log N) lower-bound lookup precedes constant arithmetic and a fresh derivative pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both derivatives share the interval width, local parameter, secant and prepared curvatures.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the fresh two-number result escapes; the spline is not mutated or retained.

# src/geometry/construction/AutoMovieNaturalSpline.ts#AutoMovieNaturalSpline.read

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same value and derivative polynomial owners after a lower-bound search on admitted increasing knots.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A combined query serves Outline.at while scalar evaluate remains value-only.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact-knot left ties, NaN's last interval and straight exterior tangents retain their existing arithmetic; no cursor or clamp is added.

## @evidence contracts/development/common.md#meaningful-documentation

Returns [value,first,second] in the selected parameter; borrowed spline arrays must remain unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(log N) lookup and constant polynomial work replace two linear scans.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both existing polynomial readers share the selected span without caching query history.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A fresh three-number tuple and local derivative pair are call-owned; nothing is retained.

# src/geometry/construction/AutoMovieNaturalSpline.ts#AutoMovieNaturalSpline.jerk

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Third derivative at x of the same piecewise cubic as {@link evaluate}: constant `(M_{k+1} - M_k) / h` on the interval {@link derivative} reads, zero beyond the end knots.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Third derivative at x of the same piecewise cubic as : constant `(M_{k+1} - M_k) / h` on the interval reads, zero beyond the end knots) directly over its typed inputs (`spline`, `x`) as a fixed number of statements with no loop or recursion in the body, delegating to `interval`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 7 lines and 5 top-level statements that reuses `interval` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 6 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `spline`, `x`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.

# src/geometry/construction/AutoMovieNaturalSpline.ts#AutoMovieNaturalSpline.periodic

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the same cyclic equations, 64 Jacobi sweeps and literal span reader to their shared periodic owner; the extracted arithmetic and phase reduction remain unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The existing function signature returns only the value capability of one preparation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The contraction bound fixes the sweep count; nothing is clamped and fewer than three values are the caller's premise.

## @evidence contracts/development/common.md#meaningful-documentation

States the equations, the solver's bound, the premise and the reading.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(64 m) to prepare and constant time a reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The shared owner solves curvatures once for every reading; this value-only wrapper performs no optional range conversion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader retains the values and m curvatures only.
