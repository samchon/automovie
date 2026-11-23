# src/validation/IAutoMovieConstraintViolation.ts#IAutoMovieConstraintViolation

## @evidence contracts/development/design.md#principled-representation

violation and ViolationCollector retain the failed rule category, severity, located path and observed value; toValidation treats any error as failure and preserves warnings alongside errors.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One data record supports direct and build callers; optional magnitude and script-node location add context without separate feedback subclasses.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Severity is the producer's explicit classification, not inferred from numeric size. A warning remains observable but does not independently fail the canonical validation envelope.

## @evidence contracts/development/common.md#meaningful-documentation

Fields distinguish classification, binding severity, path, expected rule, original unknown value and optional channel-unit overshoot or screenplay location.
