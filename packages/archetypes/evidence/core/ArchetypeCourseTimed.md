# src/core/ArchetypeCourseTimed.ts#ArchetypeCourseTimed.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the instants and bends it gives, pointing to the documented caller for the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Cubic Hermite interpolation of each coordinate in time with the tangent of the parabola through each sample and its two neighbours (one-sided at the ends, a chord between two samples), which is C1 and passes through every sample, each knot's tangent limited to Fritsch and Carlson's monotone region along the adjacent chords (limitMonotoneTangents) so no interval runs back along its chord, as a cubic out of a hold otherwise would. Speed is the velocity's length, heading its direction seen from above, and curvature (x' z'' - z' x'') over the horizontal speed cubed, positive to the left. Distance is the arc length, integrated by five-point Gauss-Legendre quadrature over `PIECES` pieces per interval, and inverted by Newton's method on the speed, kept inside its piece by bisection where the speed vanishes. Consecutive equal points use a constant position with zero shared endpoint tangents. One adjoining one-sided direction provides facing for the whole hold. A hold with incompatible directions at arrival and restart refuses because the same standing orientation cannot continue onto both moving cubics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the samples, find equal spans and shared tangents, tabulate arc length, prepare the stationary facing and scan the bends.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The existing bend grid still measures every moving cubic. Equal marks require exact equality in all three coordinates, so no speed, curvature or small displacement on a genuine bend is clamped. A second outside the samples holds the nearer end.

## @evidence contracts/development/implementation.md#efficient-algorithms

Planning sweeps the samples and the piece grid of `PIECES`; a sample finds its interval by binary search and evaluates one cubic; `when` searches the table and takes a few Newton steps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The tangents and the arc-length table serve every sample of a ride.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the samples, their tangents, stationary spans and facing, and the arc-length table for as long as its caller keeps it.
