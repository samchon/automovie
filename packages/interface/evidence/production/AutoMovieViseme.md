# src/production/AutoMovieViseme.ts#AutoMovieViseme

## @evidence contracts/development/common.md#meaningful-documentation

States the standard the set comes from, the names and the sounds each class covers.

## @evidence contracts/development/design.md#principled-representation

The 15 visemes of ISO/IEC 14496-2 Annex C as a closed union, derived from the keys of `IAutoMovieHumanVisemeWeights` so the timing chain and the Human share one vocabulary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns it; the IPA table, the timed viseme, the mouth range, the join and render's preset mapping use it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No second list of names is declared; the alias names the existing owner's keys.
