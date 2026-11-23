# src/cinematics/IAutoMovieValidatePerformShotFraming.ts#IAutoMovieValidatePerformShotFraming

## @evidence contracts/development/design.md#principled-representation

IResult preserves the independent outcomes of two closed-vocabulary membership checks; numerical camera validity is outside these flags.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Frame-action and coverage gates consume the same two flags while detailed findings remain in their supplied collector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No invalid argument is coerced or defaulted, and true flags are not misrepresented as type predicates.

## @evidence contracts/development/common.md#meaningful-documentation

IResult explains partial validity, diagnostic side effects and result ownership.

# src/cinematics/IAutoMovieValidatePerformShotFraming.ts#IAutoMovieValidatePerformShotFraming.IResult

## @evidence contracts/development/design.md#principled-representation

Two independent booleans preserve partial validity: either vocabulary can fail alone. Neither flag validates timing, subject resolution, lens values or the collector's earlier findings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Frame-action and coverage gates read these flags to decide whether to create jobs while validatePerformShotFraming appends detailed failures to their shared collector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Invalid values are neither coerced nor defaulted; the flags are not TypeScript type predicates and do not narrow the original arguments.

## @evidence contracts/development/common.md#meaningful-documentation

Defines each flag's scope, independent failure, diagnostic side effects and result ownership.
