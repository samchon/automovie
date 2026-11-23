# src/fluid/IAutoMovieFluidSolver.ts#IAutoMovieFluidSolver

## @evidence contracts/development/design.md#principled-representation

Gravity drives the linearized surface-gradient step, drag divides velocity by 1 + dt * drag and dryDepth controls wetting. The analytic gravity-wave Courant condition uses referenceDepth; finite representable derived arithmetic and depth within that design premise are required for its stability interpretation, and current validation does not prove them for every admitted record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six scalars are everything the fixed-step solver reads; the step cap lives here because it bounds the cost of a seek through the same clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No step is chosen for the author and inflow is not silently clamped to design depth. A derived NaN Courant value can escape the greater-than-one comparison, and sources can exceed the depth used by the one-time bound; these unresolved limits are not a stable-solve guarantee.

## @evidence contracts/development/common.md#meaningful-documentation

States scalar admission, the computed comparison and NaN gap, reference-depth limitation, units, wet/dry and drag rules, and the absolute seek budget.
