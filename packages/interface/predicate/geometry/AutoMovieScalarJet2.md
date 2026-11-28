# src/geometry/AutoMovieScalarJet2.ts#AutoMovieScalarJet2

## @evidence contracts/development/common.md#meaningful-documentation

Mutable tuple holding a scalar value and its first two derivatives in one declared parameter.

## @evidence contracts/development/design.md#principled-representation

Readers address value, first derivative and full second derivative in order. The representation retains the derivative scale of the owning parameter.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three scalars carry the jet. The owning field supplies units, independent parameter and any chain-rule conversion.
