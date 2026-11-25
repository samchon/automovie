# src/physics/IAutoMovieChoosePhysicalSupportFit.ts#IAutoMovieChoosePhysicalSupportFit.IInput

## @evidence contracts/development/common.md#meaningful-documentation

States candidate ordering, residual admission, reference continuity and earlier-candidate tie handling.

## @evidence contracts/development/design.md#principled-representation

Fit retains the candidate's complete subtype while requiring world transforms and metre residuals; tolerance and nonempty candidates are runtime premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

choosePhysicalSupportFit returns one original candidate, so its generic preserves fields consumed by the caller instead of copying a parallel result shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Without an admissible candidate the lowest residual remains visible; an absent completed reference cannot establish temporal continuity.
