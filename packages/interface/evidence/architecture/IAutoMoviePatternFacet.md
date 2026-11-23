# src/architecture/IAutoMoviePatternFacet.ts#IAutoMoviePatternFacet

## @evidence contracts/development/design.md#principled-representation

Unrolls a folded or curved host into one developed plane and returns each zone's strip onto its own flat panel by translating from `anchor`, so distances measured on the surface stay true.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A zone, an anchor and a frame are all a fold needs; a piece crossing a fold is two zones, so no per-piece panel assignment is needed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No piece is split or bent at a fold here; a crossing piece must be authored as two zones, and a duplicated or undeclared zone is refused rather than resolved by precedence.

## @evidence contracts/development/common.md#meaningful-documentation

States why patterns are laid on a developed plane, the anchor's role, why a module belongs to one panel, the landing formula, and each refusal and the default frame.
