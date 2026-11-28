# src/scene/AutoMovieRenderInspection.ts#AutoMovieRenderInspection.placeLabels

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the input order, projected anchors, positive integer sizes and the reasons a candidate can be dropped.

## @evidence contracts/development/implementation.md#principled-implementation

Apply continuous camera bounds before converting to pixel anchors. The label placer tests overlap using the identical clamped rectangle that the stamp fills. A kept label can be painted without intersecting an earlier kept box.

## @evidence contracts/development/implementation.md#efficient-algorithms

The routine projects each candidate once and only compares with previously kept labels. It reuses one temporary vector and never inspects pixels.

# src/scene/AutoMovieRenderInspection.ts#AutoMovieRenderInspection.planTrailTimes

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the running interval, tick frequency, drawn second and the maximum number of samples.

## @evidence contracts/development/implementation.md#principled-implementation

The request's finite duration and reach define the allowable range around the selected second. Whole tick offsets provide exact sample identity relative to that second. Clip both horizons before counting samples so out-of-interval times are never placed.

## @evidence contracts/development/implementation.md#efficient-algorithms

The planner walks only tick offsets in the clipped request. A 1,201-sample limit covers ten seconds either side at 60 Hz including the selected instant and bounds subsequent scene seeks.

# src/scene/AutoMovieRenderInspection.ts#AutoMovieRenderInspection.sampleTrails

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc describes world coordinates, sequential placement, the final scene state and the conditions that split an observed segment.

## @evidence contracts/development/implementation.md#principled-implementation

The sampler waits for each seek before sampling an attached instance and checks its path against the original selection. A missing, replaced or nonfinite instance ends the active segment. The sampler compares ancestor references before continuing a segment and starts another when an identically named parent is replaced. Each segment contains only its actual world samples.

## @evidence contracts/development/implementation.md#efficient-algorithms

The number of awaits is bounded by the accepted sample count. Selection is bounded to 64 paths. Existing object identities are checked along their parent chain. Rebinding missing paths traverses the scene once for that sample. The operation returns only times and xyz coordinates, releasing held object references on return or rejection.

# src/scene/AutoMovieRenderInspection.ts#AutoMovieRenderInspection.markTrails

## @evidence contracts/development/common.md#meaningful-documentation

The documentation defines the sample clocks, world-coordinate marks, the independent authored route and when to emphasize a current point.

## @evidence contracts/development/implementation.md#principled-implementation

Each observed segment produces its own marks so a polyline cannot bridge a missing interval. Highlighting is restricted to a selected time inside that segment, and a tie retains the earlier sample. A separate authored polyline is emitted only from a segment containing the exact drawn sample.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation iterates each segment's times and reuses its saved origin coordinates. Only the drawn sample's authored route is flattened for a mark. All observations come from the supplied segments.
