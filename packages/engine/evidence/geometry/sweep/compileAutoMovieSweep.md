# src/geometry/sweep/compileAutoMovieSweep.ts#compileAutoMovieSweep

## @evidence contracts/development/implementation.md#principled-implementation

Per-direction interpolation of key-section radii by a C2 spline under tension keeps curvature continuous through the stations with the scalar spline's sampled overshoot policy; queried non-positive radius and scale values are refused; guides form a sampled Gordon correction of the station profiles and guide curves in radius, exact at grid-aligned guide directions with linear angular reconstruction elsewhere; features target smooth curves, applied as a compactly supported C2 bump of the residual in the local cylindrical metric approximation; orientations follow the nlerp of key-section rotations from the sweep-based deformation literature. Limitation: overlapping feature bands add, so neither passes exactly through its curve there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One compile owns the four layers in their fixed order; section evaluation, spine transport and orientation are delegated to their own modules, the last two shared with posed sweeps.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid stations, guides and features are refused rather than reordered or clamped, and nothing is tuned for a particular caller.

## @evidence contracts/development/common.md#meaningful-documentation

States each layer's rule and guarantee, the Gordon construction and how incompatible guides are resolved, the feature metric and kernel, the frame rule and its source, the overlap limitation and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S stations, G guides, F feature segments and D = 512 directions: compile is O(S D) section sampling plus D interpolants and each feature's O(n log n) seeds and O(n) per value-spline tension trial; a new row costs O(D (log S + log G)); a point query costs O(1) on a cached row plus O(F) for features whose band reaches its `u`, with each feature's course compiled and unwrapped once, scalar profile queries allocate nothing when every needed guided row is cached, while point and frame queries return small records.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The mean station radius is computed once for all feature compiles without a flattened copy. Guided rows are cached by exact `u`, because sampling a grid queries every row at many `v`; a row depends only on the immutable compiled stations and guides, so the cache never invalidates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The surface retains the station radii (S D numbers), the D interpolants, O(16 F) feature seeds and coefficients, the spine's transport tables and at most 8,192 cached rows of D numbers, cleared when full; everything is released with the surface.
