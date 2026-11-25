# src/human/generation/IAutoMovieHumanApertureSpan.ts#IAutoMovieHumanApertureSpan.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

A rim point on its chain, with its chart on the neighbour where it lies on their shared ring.

## @evidence contracts/development/design.md#principled-representation `chain`: The chain the point is evaluated on. `s`: Station, mm. `t`: Phase, radians, on the branch the loop runs on.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanApertureSeam.drawn. Read by AutoMovieHumanApertureSeam.drawn. Also types AutoMovieHumanApertureSpan.points, AutoMovieHumanApertureSpan.sequence.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `also`: The same point in the neighbour's chart, for a point on the shared ring.

# src/human/generation/IAutoMovieHumanApertureSpan.ts#IAutoMovieHumanApertureSpan.ISpan

## @evidence contracts/development/common.md#meaningful-documentation

An opening's trim on one or two chains.

## @evidence contracts/development/design.md#principled-representation `chains`: The chains, the one holding the most points first. `points`: The rim: the feet of the kept margin points, in margin order. `loops`: Each chain's polygon `[station, phase]` for the cells it leaves out, closed past the shared ring.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanApertureSpan.of. Read by AutoMovieHumanBodySurfaceOpening.open. Also types AutoMovieHumanBodySurface.spans, AutoMovieHumanBodySurface.span.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `chains`, `points`, `loops`; callers supply the complete record.
