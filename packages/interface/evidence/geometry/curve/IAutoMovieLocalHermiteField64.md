# src/geometry/curve/IAutoMovieLocalHermiteField64.ts#IAutoMovieLocalHermiteField64.Cell

## @evidence contracts/development/design.md#principled-representation

Four complete cubic rows retain the local tensor coefficients in millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Phase extent accompanies its coefficient grid.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No sample or source topology substitutes for coefficients.

## @evidence contracts/development/common.md#meaningful-documentation

States grid direction and units.

# src/geometry/curve/IAutoMovieLocalHermiteField64.ts#IAutoMovieLocalHermiteField64.Jet

## @evidence contracts/development/design.md#principled-representation

Complete evaluated first derivatives retain their chart scale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One jet supplies positions and analytic normals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Partials are not unit tangent hints.

## @evidence contracts/development/common.md#meaningful-documentation

States units of both independent parameters.

# src/geometry/curve/IAutoMovieLocalHermiteField64.ts#IAutoMovieLocalHermiteField64.Prepared

## @evidence contracts/development/design.md#principled-representation

Interval cells use at most four contributing courses and station jets use the same fixed derivative weights.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two operations expose analytic cells and authoritative station-edge jets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shared boundaries are evaluated from the original course rather than adjacent rounded restrictions.

## @evidence contracts/development/common.md#meaningful-documentation

States immutable lifetime and right-sided knot derivatives, with the final endpoint left-sided.
