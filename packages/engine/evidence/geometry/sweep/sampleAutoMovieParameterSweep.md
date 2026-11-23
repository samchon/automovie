# src/geometry/sweep/sampleAutoMovieParameterSweep.ts#sampleAutoMovieParameterSweep

## @evidence contracts/development/implementation.md#principled-implementation

Signed Cartesian tensor-product trapezoid integration, with scale inside the u integral and magnitude-normalized weighted means. Parameter-space origin/cancellation is geometrically valid; radial positivity is not imposed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One producer is called only by the parameter branch; the original radial writer is unchanged. Scale/frame readers preserve staged girth and posed buffer ownership.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No fixture-specific behavior or polar fallback. Nonfinite data, lost positive weights and unrepresentable nonzero means/products are refused.

## @evidence contracts/development/common.md#meaningful-documentation

States units, correspondence, integration order, cancellation, numeric refusal and output failure effects.

## @evidence contracts/development/implementation.md#efficient-algorithms

At registration, at most nine source shape reads; each write has at most three scale products and two short coordinate reductions, O(1) with no allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The angular averages and u scale slots are compiled once; each pose/girth pass reads the current frame/scales through the supplied views.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains at most three unscaled points, three weights/slots, two scaled work arrays and one two-coordinate mean buffer until its owning rig is released.
