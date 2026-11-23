# src/geometry/sweep/IAutoMovieSweepSection.ts#IAutoMovieSweepSection

## @evidence contracts/development/design.md#principled-representation

A closed union whose members are the standard closed-curve forms named in the lofting scope, read through one polar radius function, which makes sections of different kinds correspond by direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One discriminated union instead of a section interface per kind; `parameterizeAutoMovieSweepSection` evaluates the curves and `sampleAutoMovieSweepSection` reads them by direction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing converts one kind into another silently; the sampler refuses a curve whose finite polar-angle walk detects a star-shape violation; unsampled intervals are not certified.

## @evidence contracts/development/common.md#meaningful-documentation

States the plane coordinates and unit, the origin, the star-shape requirement, the angle direction, and what each member is for.

# src/geometry/sweep/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IPoint

## @evidence contracts/development/design.md#principled-representation

A point of a section plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two coordinates.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values are used as given.

## @evidence contracts/development/common.md#meaningful-documentation

States the axes and unit.

# src/geometry/sweep/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.ISuperellipse

## @evidence contracts/development/design.md#principled-representation

A superellipse per quadrant, whose polar radius is closed-form when centred.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four half-axes, four exponents and an optional centre.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Half-axes and exponents out of range are refused.

## @evidence contracts/development/common.md#meaningful-documentation

States the quadrant formula and what the exponent does.

# src/geometry/sweep/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IBSpline

## @evidence contracts/development/design.md#principled-representation

A closed uniform cubic B-spline, the curve a Catmull-Clark ring converges to.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Control points only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Fewer than three points are refused.

## @evidence contracts/development/common.md#meaningful-documentation

States the closure and why it matches subdivision.

# src/geometry/sweep/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IBezier

## @evidence contracts/development/design.md#principled-representation

A closed piecewise cubic Bezier curve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Anchors and handles in threes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A point count not a multiple of three is refused.

## @evidence contracts/development/common.md#meaningful-documentation

States the point layout.

# src/geometry/sweep/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IPolygon

## @evidence contracts/development/design.md#principled-representation

A closed polygon whose corners correspond by index under parameter correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Corners only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Fewer than three corners are refused.

## @evidence contracts/development/common.md#meaningful-documentation

States corner correspondence and concavity.

# src/geometry/sweep/IAutoMovieSweepSection.ts#IAutoMovieSweepSection.IRadial

## @evidence contracts/development/design.md#principled-representation

Radii at even angles joined by the periodic bounded spline.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One array.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Non-positive radii are refused.

## @evidence contracts/development/common.md#meaningful-documentation

States the angle of each radius and the interpolation.
