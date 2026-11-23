# src/environment/IAutoMovieTrackCourse.ts#IAutoMovieTrackCourse.IInput

## @evidence contracts/development/design.md#principled-representation

A centripetal spline passes through the authored points. Banks are interpolated between them and added to transported frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Points, optional one bank per point and an optional starting lateral direction specify all spatial degrees of freedom.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed paths implicitly return to the first point. Repeated neighbors, malformed banking and a parallel starting lateral direction are refused during course preparation.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies input units, default orientation and bank, and how the closing waypoint is formed.

# src/environment/IAutoMovieTrackCourse.ts#IAutoMovieTrackCourse.IPrepared

## @evidence contracts/development/design.md#principled-representation

Stations are strictly increasing sampled chord sums. Each station lies on the same spline used for distance queries.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The retained station table supplies both track mesh samples and the carrier's distance clock without another sampling pass.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The station table does not assert exact spline arc length. The evaluator refuses nonfinite distances and values beyond the prepared interval.

## @evidence contracts/development/common.md#meaningful-documentation

States the distance approximation, closure flag and frame axes.
