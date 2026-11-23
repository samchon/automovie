# src/human/generation/foot/IAutoMovieHumanFootToeBreadth.ts#IAutoMovieHumanFootToeBreadth.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the breadth reads.

## @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `lines`: Every toe's line, hallux first. `index`: Which toe, 0 for the hallux.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootToeBreadth.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frame`, `lines`, `index`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootToeBreadth.ts#IAutoMovieHumanFootToeBreadth.IBreadth

## @evidence contracts/development/common.md#meaningful-documentation

A toe's line and breadth.

## @evidence contracts/development/design.md#principled-representation `head`: Metatarsal head centre, left frame. `tip`: The apex. `length`: The line's length, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootToeBreadth.of. Read by AutoMovieHumanFootToeCap.of, AutoMovieHumanFootToeRoot.of. Also types AutoMovieHumanFootToeSpan.breadth.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `head`, `tip`, `length`, `tangent`, `pointAt`, `shape`, `half`; callers supply the complete record.
