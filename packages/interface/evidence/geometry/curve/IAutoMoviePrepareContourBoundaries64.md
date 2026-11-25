# src/geometry/curve/IAutoMoviePrepareContourBoundaries64.ts#IAutoMoviePrepareContourBoundaries64.IPlans

## @evidence contracts/development/common.md#meaningful-documentation

Each upper section ordinal k addresses the shared rings[k-1]/rings[k] boundary and its declared local groups. The generic preserves concrete group metadata; index validity and shared ring identity are admitted upstream, while unsupported groups remain explicit.

## @evidence contracts/development/design.md#principled-representation

Each upper section ordinal k addresses the shared rings[k-1]/rings[k] boundary and its declared local groups.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contour-loft work supplies these borrowed group objects to prepareAutoMovieContourBoundaries64.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The generic preserves concrete group metadata; index validity and shared ring identity are admitted upstream, while unsupported groups remain explicit.

# src/geometry/curve/IAutoMoviePrepareContourBoundaries64.ts#IAutoMoviePrepareContourBoundaries64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Group-object keys carry latest interaction qualification and diagnostic history; observations retain millimetre endpoints and optional millisecond timings. Trace messages can survive successful qualification, and later slit failures can coexist with earlier interaction entries; consumers must inspect group status too.

## @evidence contracts/development/design.md#principled-representation

Group-object keys carry latest interaction qualification and diagnostic history; observations retain millimetre endpoints and optional millisecond timings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Boundary preparation returns the new maps and traces to contour-loft emission while borrowing original group keys.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Trace messages can survive successful qualification, and later slit failures can coexist with earlier interaction entries; consumers must inspect group status too.
