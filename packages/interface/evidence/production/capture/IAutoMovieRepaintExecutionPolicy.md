# src/production/capture/IAutoMovieRepaintExecutionPolicy.ts#IAutoMovieRepaintExecutionPolicy

## @evidence contracts/development/design.md#principled-representation

Numeric fields and a closed retry vocabulary describe the intended attempt, time and cost envelope. Safe-integer bounds, finite cost, backoff cardinality and remaining budgets are documented obligations, not checks performed by this erased type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One policy groups attempt, elapsed-time and cost limits with retry classes and backoff values, keeping the intended execution envelope explicit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The retry vocabulary omits cancellation, stale input and budget exhaustion. No current execution host implements charging, cancellation or deadline enforcement for this retained policy.

## @evidence contracts/development/common.md#meaningful-documentation

Defines attempts, millisecond deadlines and total ceiling, adapter cost units, backoff population and explicit retry classes.
