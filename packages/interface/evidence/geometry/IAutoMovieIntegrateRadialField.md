# src/geometry/IAutoMovieIntegrateRadialField.ts#IAutoMovieIntegrateRadialField.IOutput

## @evidence contracts/development/design.md#principled-representation

All coordinates and radius share one caller-selected length unit; scalar integral and area have squared units, and integrated gradient has length units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

integrateAutoMovieRadialField owns radial integration; the caller owns plane construction, convexity, site enumeration and field scale.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer admits dense finite coordinates, positive representable radius and powers 2 or 3, with at most 512 sites; convexity remains a premise and finite precision is not a certified bound.

## @evidence contracts/development/common.md#meaningful-documentation

Area integrals of a strongest-site compact radial field on a convex plane region. All coordinates and radius share one caller-selected length unit; scalar integral and area have squared units, and integrated gradient has length units.

# src/geometry/IAutoMovieIntegrateRadialField.ts#IAutoMovieIntegrateRadialField.IProps

## @evidence contracts/development/design.md#principled-representation

All coordinates and radius share one caller-selected length unit; scalar integral and area have squared units, and integrated gradient has length units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

integrateAutoMovieRadialField owns radial integration; the caller owns plane construction, convexity, site enumeration and field scale.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer admits dense finite coordinates, positive representable radius and powers 2 or 3, with at most 512 sites; convexity remains a premise and finite precision is not a certified bound.

## @evidence contracts/development/common.md#meaningful-documentation

Area integrals of a strongest-site compact radial field on a convex plane region. All coordinates and radius share one caller-selected length unit; scalar integral and area have squared units, and integrated gradient has length units.
