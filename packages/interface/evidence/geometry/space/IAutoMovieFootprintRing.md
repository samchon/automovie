# src/geometry/space/IAutoMovieFootprintRing.ts#IAutoMovieFootprintRing

## @evidence contracts/development/design.md#principled-representation

footprintRing retains authored world vertices, copies their XZ projection and sums oriented shoelace cross products; binary64 cancellation can affect signed area for large translations or very small regions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Source points, planar predicate input and cached area stay in one ring so repeated space queries need no projection allocation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The ring preserves authored order and concavity without hull replacement; it performs no topology validation or automatic winding repair.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes borrowed world points from fresh planar coordinates and twice-signed area; zero area is a degenerate or cancelling calculation, not proof of collinearity for arbitrary rings.
