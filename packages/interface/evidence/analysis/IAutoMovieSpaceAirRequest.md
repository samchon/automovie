# src/analysis/IAutoMovieSpaceAirRequest.ts#IAutoMovieSpaceAirRequest

## @evidence contracts/development/design.md#principled-representation

Volume, outdoor-air flow, occupancy and per-person generation are exactly the inputs of a well-mixed single-zone balance, whose air change rate, per-person rate and steady-state concentration are closed forms over them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scalars only, because a zone model has no geometry; the targets ride along so the run judges its own metrics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A null flow and zero occupancy are accepted inputs that produce gaps naming the missing quantity, never substituted defaults.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation lists every refused input and the null and zero flow outcomes, and each property states its unit, range and what zero means.
