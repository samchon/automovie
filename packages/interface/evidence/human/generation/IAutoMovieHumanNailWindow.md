# src/human/generation/IAutoMovieHumanNailWindow.ts#IAutoMovieHumanNailWindow

## @evidence contracts/development/common.md#meaningful-documentation

A nail plate's window on its digit chain.

## @evidence contracts/development/design.md#principled-representation `chain`: Digit chain the plate lies on, e.g. `root`: Chain station of the plate's root (the cuticle), mm. `edge`: Chain station of the plate's free edge, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootToeChain.nail.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `chain`, `root`, `edge`, `width`, `dorsal`; callers supply the complete record.
