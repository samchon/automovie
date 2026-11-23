# src/motion/human/floor/IAutoMovieMotionHumanGetUp.ts#IAutoMovieMotionHumanGetUp.Stage

## @evidence contracts/development/common.md#meaningful-documentation

States each route's key postures and the shared standing endpoint.

## @evidence contracts/development/design.md#principled-representation

A closed scalar key connects the posture table, bearing table and ordered routes without inferring admission from a runtime object.

## @evidence contracts/development/design.md#minimal-and-owned-surface

getUp.POSES, BEARS and ROUTES use this same Stage key.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

POSES is checked against the contract, so adding a table row cannot silently extend the public route vocabulary.

# src/motion/human/floor/IAutoMovieMotionHumanGetUp.ts#IAutoMovieMotionHumanGetUp.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

A closed pattern, a side and a manner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No angle is typed by the author.

# src/motion/human/floor/IAutoMovieMotionHumanGetUp.ts#IAutoMovieMotionHumanGetUp.Pattern

## @evidence contracts/development/common.md#meaningful-documentation

How the body gets up (VanSant 1988's axial region).

## @evidence contracts/development/design.md#principled-representation

Closed choices "symmetric", "rotation" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: floor/getUp.ts (getUp.PATTERNS); floor/getUp.ts (getUp.ROUTES); floor/getUp.ts (getUp.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in getUp.PATTERNS.
