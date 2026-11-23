# src/pose/IAutoMovieTwoBoneIK.ts#IAutoMovieTwoBoneIK

## @evidence contracts/development/design.md#principled-representation

The interior angles at the mid joint and root follow the law of cosines on the reachable triangle, subject to binary64 precision; solveTwoBoneIK owns common-unit rescaling and refuses unrepresentable relative side products before constructing this record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two scalar angles and a flag, the plane-free part of a two-bone solve, so arm and leg callers orient the chain in their own bend plane.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unreachable goal is clamped to the reachable shell and reported with `clamped` rather than returning `NaN` or silently presenting the clamped pose as a hit.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and consumer, the unit, the meaning and range of each angle including the straight and folded ends, the zero-distance convention, and what `clamped` reports.
