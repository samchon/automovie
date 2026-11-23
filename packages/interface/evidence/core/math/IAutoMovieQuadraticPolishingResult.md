# src/core/math/IAutoMovieQuadraticPolishingResult.ts#IAutoMovieQuadraticPolishingResult

## @evidence contracts/development/design.md#principled-representation

Records coordinate-wise dual correction for a fixed feasible primal and active-set working steps with blocking constraints, the two corrections the producer runs; admission is a separate full-row KKT measurement by the refinement owner, so nothing here certifies the candidate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record for both methods, carrying the candidate, the method chosen, and per-step traces a failed solve's error message prints; fields of the method not taken stay empty or zero.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The method is chosen by measured residuals, never by a problem's phase or a particular row, and `accepted` can only be set by the independent admission.

## @evidence contracts/development/common.md#meaningful-documentation

States how the method is chosen, the shared budget, that the values are an unadmitted candidate, who admits them, and ownership; each field states its unit and which method fills it.
