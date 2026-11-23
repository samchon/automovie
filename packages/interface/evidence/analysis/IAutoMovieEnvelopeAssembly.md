# src/analysis/IAutoMovieEnvelopeAssembly.ts#IAutoMovieEnvelopeAssembly

## @evidence contracts/development/design.md#principled-representation

One-dimensional steady-state conduction through a series resistance network, `U = 1 / (Rsi + sum(t / lambda) + Rse)`, which holds for homogeneous parallel layers away from edges; bridges are carried separately by the request.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The assembly holds its own layers, both films, an area and a sample point, so the analyzer solves each assembly independently and then area-weights them without any shared table.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The engine ships no conductivity or film table; the production declares every value, and the boundary name is carried, not resolved or defaulted.

## @evidence contracts/development/common.md#meaningful-documentation

States the transmittance law, the samples reported and when either is absent, the m^2*K/W and m^2 units, the positivity rules, what the area weights, and that layer order does not change the sum.
