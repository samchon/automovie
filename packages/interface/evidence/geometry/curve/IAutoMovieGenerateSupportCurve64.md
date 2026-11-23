# src/geometry/curve/IAutoMovieGenerateSupportCurve64.ts#IAutoMovieGenerateSupportCurve64.IProps

## @evidence contracts/development/design.md#principled-representation

Harmonic index determines normal-angle frequency; coefficients have millimetre units and a power-of-two span count partitions one full turn.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The support-curve generator needs only caller identity, finite Fourier coefficients and the explicit normal-angle partition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Convexity remains an admitted analytic radius estimate; no source perimeter, sampled mesh or fallback convex fit enters this contract.

## @evidence contracts/development/common.md#meaningful-documentation

States Fourier convention, units, coefficient bounds, admission owner and copied input lifetime.

# src/geometry/curve/IAutoMovieGenerateSupportCurve64.ts#IAutoMovieGenerateSupportCurve64.IResult

## @evidence contracts/development/design.md#principled-representation

Millimetre polynomial positions use phase in turns while analytic radius and Hermite remainder estimates retain millimetre units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

generateAutoMovieSupportCurve64 returns the canonical cubic declaration plus the three scalar qualifications computed from its supplied Fourier support function.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Analytic support perimeter is not asserted to equal polynomial arclength, and finite estimates are not outward-rounded certificates.

## @evidence contracts/development/common.md#meaningful-documentation

Defines local plane, phase convention, shared endpoint storage and the distinct meanings of the scalar estimates.
