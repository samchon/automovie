# src/fluid/IAutoMovieFluidSource.ts#IAutoMovieFluidSource

## @evidence contracts/development/design.md#principled-representation

For each active step start in [start, end), simulateFluidDomain adds flowRate * dt to the cell update and the source ledger. The same contribution targets finite-arithmetic volume balance; authored-field finiteness alone does not prove finite products or cumulative totals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A single-cell constant-rate inflow with a time window covers taps, jets and supply ports, and `lowerWetZoneDrainage` produces these records from service-network supply ports without a second flow model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No current-depth or referenceDepth cap discards authored inflow. Rising beyond the stability design depth and nonfinite derived ledger arithmetic remain the solver/state types' documented limits rather than a universal conservation guarantee.

## @evidence contracts/development/common.md#meaningful-documentation

States the validation rules and where added volume is counted; members give units, index ranges, that the full amount arrives however deep the cell is, and the half-open activity window.
