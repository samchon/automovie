# src/drawing/IAutoMovieOpeningFillExtent.ts#IAutoMovieOpeningFillExtent.IResult

## @evidence contracts/development/design.md#principled-representation

Height is the world Y span and width is max(X span, Z span), both metres; orientation-independent local dimensions are not represented. A finite nonempty input is needed for usable nonnegative spans.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Opening-fill fallback and room schedule bounds use this shared world-axis reading; profile-local hole dimensions remain a separate contract because their frame differs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rotated/lying leaves retain their measured world bounds and callers label fill-based measurements, rather than claiming manufactured leaf dimensions or hole clearance.

## @evidence contracts/development/common.md#meaningful-documentation

States axes, metres, orientation limitation, empty/single-point cases, numerical premises and output ownership.
