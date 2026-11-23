# src/analysis/IAutoMovieEnvelopeRequest.ts#IAutoMovieEnvelopeRequest

## @evidence contracts/development/design.md#principled-representation

Supplies the boundary conditions of the steady-state network (indoor air and humidity, one outdoor air temperature from a declared instant) and the network itself, so heat flow and interior-surface condensation are both closed forms over it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One request feeds both the thermal and the moisture run, so the two runs share one validated input and one settings digest instead of two requests that could drift apart.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No exterior temperature is assumed: a null instant or one without an outdoor temperature produces `not-run` runs naming the missing input.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation lists every refused input and the `not-run` case, and each property states its role, bounds, and how the runs and targets use it.
