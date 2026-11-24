# src/geometry/construction/AutoMovieConstructionSplitConormal.ts#AutoMovieConstructionSplitConormal.Forks

## @evidence contracts/development/common.md#meaningful-documentation

Names the directed tangent and transverse vectors at the two forks in seam order.

## @evidence contracts/development/design.md#principled-representation

An ordered pair of actual parent-derived fork frames gives both incident branches the same endpoint tangent planes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Pairs only the two IAutoMovieConstructionSplitSeam.IFork records read by the shared conormal preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The fixed pair uses the existing interface frame type and keeps both required endpoints explicit.

# src/geometry/construction/AutoMovieConstructionSplitConormal.ts#AutoMovieConstructionSplitConormal.forks

## @evidence contracts/development/common.md#meaningful-documentation

Names the parent surface, its station and phases, and the seam-ordered pair of directed fork frames.

## @evidence contracts/development/implementation.md#principled-implementation

At each end the cross product of the actual parent normal and the exact seam tangent gives the tangent-plane transverse direction. Its sign faces the seam's declared plane normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same end reader serves both phases and reports the missing regular tangent plane as a refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses cross products of supplied first derivatives and the seam tangent. A zero transverse vector has no admitted direction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluates two parent surface jets and two seam endpoints.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both incident branches consume the one returned pair of fork frames.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The pair contains the evaluated vectors and holds no source callbacks.

# src/geometry/construction/AutoMovieConstructionSplitConormal.ts#AutoMovieConstructionSplitConormal.baseline

## @evidence contracts/development/common.md#meaningful-documentation

Names the uncorrected strip ribbon and its value and first and second derivatives at a changing clock.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the first published layer's periodic cubic for the horizontal slopes and its scalar cubic for the lift slopes. Their derivatives form the exact three-component cross-ribbon jet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reader gathers the two existing spline results into three world-coordinate vectors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the strip's actual coefficient rows. Regular published strip axes and coefficients are caller premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses the four active periodic cubic controls for the horizontal and lift rows on each call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Captures the same spline order and coefficient rows for all changing clocks of this strip.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader borrows the strip's fixed rows. Each result contains fresh vectors.

# src/geometry/construction/AutoMovieConstructionSplitConormal.ts#AutoMovieConstructionSplitConormal.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Names the seam frame, ordered fork directions, branch sign, physical clock interval and source ribbon read. Returns a cross-ribbon correction jet or a reason for refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Reads one shared seam tangent and interpolates the parent transverse directions to the divider normal with compact quintic windows. The support of each turn ends by the midpoint. Signed endpoint projections and midpoint speed define the default gains. The measured mode uses orthonormal transverse projections and interpolates log magnitudes with a C2 step, so the branch sign is preserved. The seam supplies curvature and its derivative when differentiating the tangent jet. In the default gain field the tangential component vanishes off the fork support. Opposite signed branch gains let the incident clocks read the same tangent plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares the fixed fork projections and, when requested, the measured gain field. The returned reader applies the product and normalization derivatives to the actual seam line and subtracts the existing strip ribbon.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses fork projections or measured directions with the wrong sign and reports a vanishing transverse direction. The line and its material derivatives come from the supplied seam and ribbon.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares the measured columns, including both seam ends, when measured mode is used. The default read uses a fixed number of vector and scalar operations. The measured read adds interpolations in the retained fields.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both incident branches share the seam and fork frames. Within one branch the returned reader reuses its fixed projections and prepared interpolation across changing shares.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The branch owns the borrowed seam and ribbon reader, the two fork frames and any measured coefficient rows until the returned reader is released.
