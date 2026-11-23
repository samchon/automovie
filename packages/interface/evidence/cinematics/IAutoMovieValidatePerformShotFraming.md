# src/cinematics/IAutoMovieValidatePerformShotFraming.ts#IAutoMovieValidatePerformShotFraming.IResult

## @evidence contracts/development/design.md#principled-representation

Two independent booleans preserve partial validity: either vocabulary can fail alone. Neither flag validates timing, subject resolution, lens values or the collector's earlier findings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Frame-action and coverage gates read these flags to decide whether to create jobs while validatePerformShotFraming appends detailed failures to their shared collector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Invalid values are neither coerced nor defaulted; the flags are not TypeScript type predicates and do not narrow the original arguments.

## @evidence contracts/development/common.md#meaningful-documentation

Defines each flag's scope, independent failure, diagnostic side effects and result ownership.
