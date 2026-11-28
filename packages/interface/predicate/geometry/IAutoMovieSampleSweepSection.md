# src/geometry/IAutoMovieSampleSweepSection.ts#IAutoMovieSampleSweepSection.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed section and angular resolution for one radial profile.

## @evidence contracts/development/design.md#principled-representation

The sampler reads radial splines or centred superellipses directly. Other section curves use a finite monotone-angle walk and bisection to place ray intersections.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A section and sample count specify one fresh radius array. No sampled points or inverse tables remain with the caller.

# src/geometry/IAutoMovieSampleSweepSection.ts#IAutoMovieSampleSweepSection.IProps.section

## @evidence contracts/development/common.md#meaningful-documentation

One section in metre X/Y axes. Parameterized curves require observed counterclockwise polar progression around the origin.

# src/geometry/IAutoMovieSampleSweepSection.ts#IAutoMovieSampleSweepSection.IProps.count

## @evidence contracts/development/common.md#meaningful-documentation

Supply a safe integer of at least three. The radii occupy consecutive evenly spaced angles beginning on the first axis, with no duplicate endpoint.
