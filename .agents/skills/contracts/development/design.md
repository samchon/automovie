# Design

Answer from the declaration and its consumers.

## Principled representation

Does the type represent the domain's valid states and identify where its invariants are established?

Name what the values mean, including units, frames or clocks. Represent variants explicitly when optional fields would admit impossible combinations.

Identify the boundary that establishes the remaining invariants. Resolve a mismatch at its owner before exposing the type to consumers.

## Minimal and owned surface

Does the surface give its consumers the capabilities they need at the right owner?

Trace each non-obvious member, option or layer to a supported use. Reuse representations from their owner. Keep fixture-specific choices and test-only observations outside the contract the application exposes.
