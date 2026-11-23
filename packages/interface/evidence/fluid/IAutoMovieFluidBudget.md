# src/fluid/IAutoMovieFluidBudget.ts#IAutoMovieFluidBudget

## @evidence contracts/development/design.md#principled-representation

Every field is a closed-form count over the grid and emitters, the face count following the Arakawa C staggering of one more face than cells along the crossed axis, and `courant` comes from the same `fluidCourantNumber` the validator checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One flat record of derived numbers serves both the render metrics and a reviewer, with the refusal thresholds kept in `validateFluidDomain` rather than duplicated as fields here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Counts model uncached replay and stored scalar-array payload, excluding per-step scratch arrays, JavaScript container overhead and physical runtime duration. The reported Courant value uses direct arithmetic and can be nonfinite; this record is neither domain admission nor a measured memory/runtime bound.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, that no step is integrated, every limit the validator enforces, and which consumer reads which fields; members give each formula, its unit, and what it leaves out.
