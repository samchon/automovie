# src/architecture/IAutoMovieResolvedLayer.ts#IAutoMovieResolvedLayer

## @evidence contracts/development/design.md#principled-representation

Each layer starts at the previous computed end on the signed axis. Negative sense reverses positive-thickness endpoint order; zero-thickness membranes retain equal endpoints. Finite endpoints are enforced before resolution, while numerical rounding can collapse a sufficiently small positive thickness at a large offset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries the authored layer facts beside its placed coordinates, so downstream queries do not join back to the authored record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Coordinates are not reordered to hide the sense; consumers take min and max as documented.

## @evidence contracts/development/common.md#meaningful-documentation

States the signed coordinate convention, the reversal under a negative sense, how to take an interval, and the meaning and units of each field.
