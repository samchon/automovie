# src/human/generation/foot/IAutoMovieHumanFootToeLines.ts#IAutoMovieHumanFootToeLines.ILine

## @evidence contracts/development/common.md#meaningful-documentation

A toe's line.

## @evidence contracts/development/design.md#principled-representation `head`: Metatarsal head centre, left frame. `tip`: The apex, left frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootToeLines.of. Read by AutoMovieHumanFootToeJoints.of, AutoMovieHumanFootToeSpacing.limit. Also types AutoMovieHumanFootBones.lines, AutoMovieHumanFootToeBreadth.neighbours.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `head`, `tip`; callers supply the complete record.
