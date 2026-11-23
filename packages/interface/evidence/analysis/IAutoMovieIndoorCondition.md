# src/analysis/IAutoMovieIndoorCondition.ts#IAutoMovieIndoorCondition

## @evidence contracts/development/design.md#principled-representation

Dry-bulb temperature and relative humidity are the two inputs of the Magnus dew point and the indoor boundary condition of the steady-state network, so no further property of the air is needed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A separate record groups the two quantities that describe one body of air, keeping them apart from the exterior condition, which comes from the environment context.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Zero humidity is accepted and yields gaps rather than an error or a substituted humidity, because dry air is a real state with no dew point.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states what each value drives and the zero-humidity outcome, and each property states its unit and range with both ends of the humidity range included.
