# src/recovery/computation/IAutoMovieRecoveryFeasibleTrials.ts#IAutoMovieRecoveryFeasibleTrials

## @evidence contracts/development/design.md#principled-representation

Each real retraction/evaluation has one path and one outcome: selected, qualified unselected, or a first rejection cause, preserving the original fixed trial ceiling and gates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scalar counters distinguish baseline, nominal/numerical mixture, corrected full and accelerated half paths from qualified-unselected, feasibility, decrease and Armijo outcomes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A direction guard is not counted as an actual rejected trial, and missing cost is not zero cost or convergence.

## @evidence contracts/development/common.md#meaningful-documentation

Counts include selected, qualified unselected and rejected evaluations; lastFailure records the most recent failure even after later progress. Path totals equal iterations; accepted plus qualified-unselected plus three failure totals also equal iterations.
