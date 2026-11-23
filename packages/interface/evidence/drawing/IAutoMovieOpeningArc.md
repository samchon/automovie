# src/drawing/IAutoMovieOpeningArc.ts#IAutoMovieOpeningArc

## @evidence contracts/development/design.md#principled-representation

Centre, radius, start angle and signed sweep are the standard parametrization of a circular arc, from which both chord points and the circular-segment area follow in closed form.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four numbers the drafted outline and the exact area both need, so the conversion from a bulge happens once in `autoMovieOpeningArc`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Carries no special case; a straight edge has no arc record at all rather than a sentinel radius.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the producer, the frame, how start and sweep reach the edge's two ends, the sweep's sign convention and formula, its validated bound and the radius's sign.
