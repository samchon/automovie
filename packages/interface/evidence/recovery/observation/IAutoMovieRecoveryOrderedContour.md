# src/recovery/observation/IAutoMovieRecoveryOrderedContour.ts#IAutoMovieRecoveryOrderedContour

## @evidence contracts/development/common.md#meaningful-documentation

Ordered raw plane-cut contour with exact source segment lineage. Point and cumulative lengths are registered millimetres; edge fractions are dimensionless and source triangle/edge ordinals address the original observation input. Contour order includes open, closed and unsupported publications.

## @evidence contracts/development/design.md#principled-representation

Point and cumulative lengths are registered millimetres; edge fractions are dimensionless and source triangle/edge ordinals address the original observation input. Contour order includes open, closed and unsupported publications.

## @evidence contracts/development/design.md#minimal-and-owned-surface

observeRecoveryOrderedCuts creates these copied observations and bindRecoveryOrderedFits uses their accepted-point order to replay saved curve fits.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The broader incident-face list and exact emitting-face list remain separate; geometric proximity never substitutes for source identity.
