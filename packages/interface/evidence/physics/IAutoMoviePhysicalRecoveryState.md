# src/physics/IAutoMoviePhysicalRecoveryState.ts#IAutoMoviePhysicalRecoveryState

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes pending steps, confirmed landings, authored handoffs, recovery clocks and mutable checkpoint ownership.

## @evidence contracts/development/design.md#principled-representation

Local-second history and world-metre offsets retain causal recovery ownership; resolved status distinguishes landing, cancellation and failure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

advancePhysicalBalance mutates this caller-owned state and checkpoint replay preserves the same history rather than reconstructing it from a requested goal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional history supports initially empty state; later landings cannot be treated as earlier support and revision only invalidates transient goals.
