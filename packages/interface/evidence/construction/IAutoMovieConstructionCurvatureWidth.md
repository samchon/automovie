# src/construction/IAutoMovieConstructionCurvatureWidth.ts#IAutoMovieConstructionCurvatureWidth

## @evidence contracts/development/design.md#principled-representation

The normal curvature `k = II(d, d) / I(d, d)` (Euler, Meusnier) of the surface in the rail's direction `d` is the inverse radius of the circle the surface follows there, so a chord a share of that radius cannot carry the rail past the surface's turn whatever the part's size; the curve's geodesic curvature toward the rail is the inverse radius at which its offset cusps (Farouki and Neff 1990), so a chord a share of it keeps the rail a regular offset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A share and a cap state the law; the radius comes from the surface, not from another field.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The width follows the surface's own curvature; no floor widens a rail toward a fold and no seam drops to a lower continuity to hide one.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, the curvature's direction, why a share below one keeps the rail inside, the cap, the end bound near a surface's end, where it is evaluated and interpolated, and the admission.
