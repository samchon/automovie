# src/geometry/IAutoMoviePlanContourSlabs64Ring.ts#IAutoMoviePlanContourSlabs64Ring

## @evidence contracts/development/common.md#meaningful-documentation

The record identifies borrowed ring samples, the exact saved winding and a local refusal that preserves the source ordinal.

## @evidence contracts/development/design.md#principled-representation

Geometric planning filters for supported equal-winding rings and evaluates sampled bidirectional separation without modifying their source arrays. Refused ring slots remain addressable.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Planning needs only samples, winding and refusal status. Source curve identity and triangulation remain separate.

# src/geometry/IAutoMoviePlanContourSlabs64Ring.ts#IAutoMoviePlanContourSlabs64Ring.points

## @evidence contracts/development/common.md#meaningful-documentation

The cyclic samples retain saved point order and common model millimetres for scoring.

# src/geometry/IAutoMoviePlanContourSlabs64Ring.ts#IAutoMoviePlanContourSlabs64Ring.winding

## @evidence contracts/development/common.md#meaningful-documentation

The signed material orientation groups rings only when their winding values compare equal.

# src/geometry/IAutoMoviePlanContourSlabs64Ring.ts#IAutoMoviePlanContourSlabs64Ring.unsupported

## @evidence contracts/development/common.md#meaningful-documentation

The field keeps the refused sampled ring's source slot but excludes it from ordinary correspondence.
