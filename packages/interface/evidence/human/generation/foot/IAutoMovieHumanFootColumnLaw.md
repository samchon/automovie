# src/human/generation/foot/IAutoMovieHumanFootColumnLaw.ts#IAutoMovieHumanFootColumnLaw.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

A column's place along and across the foot, each a law of height.

## @evidence contracts/development/design.md#principled-representation `along`: Along the foot at a height, foot lengths. `across`: Across the foot at a height, foot breadths.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootColumn.law, AutoMovieHumanFootColumnLaw.plan. Also types AutoMovieHumanFootAchilles.law, AutoMovieHumanFootColumn.LAWS.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `along`, `across`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootColumnLaw.ts#IAutoMovieHumanFootColumnLaw.FitResult

## @evidence contracts/development/common.md#meaningful-documentation

The least-squares quadratic of values over heights, read at any height; a line through two knots and a constant through one.

## @evidence contracts/development/design.md#principled-representation

The least-squares quadratic of values over heights, read at any height; a line through two knots and a constant through one. The callable takes height and returns number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanFootColumnLaw.FitResult is the canonical exchange used by AutoMovieHumanFootColumnLaw.fit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanFootColumnLaw.fit for the least-squares quadratic of values over heights, read at any height; a line through two knots and a constant through one.
