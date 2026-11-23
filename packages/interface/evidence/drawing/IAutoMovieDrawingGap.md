# src/drawing/IAutoMovieDrawingGap.ts#IAutoMovieDrawingGap

## @evidence contracts/development/design.md#principled-representation

Each derivation pushes a gap at the point it skips work, counting the affected records into the reason when the absence is per record, and sorts the list with `compareAutoMovieRenderIds` so its order is independent of the design's declaration order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Subject, status, reason and remedy name omitted work, its producer-assigned category, explanation and suggested next action. One shape serves all three derivations; it does not independently validate the explanation or establish fault ownership.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Subjects are an open string owned by the deriving engine functions rather than a closed union, so nothing checks their spelling; subjects shared by two derivations currently agree in spelling and status, which only review enforces.

## @evidence contracts/development/common.md#meaningful-documentation

States why gaps exist, which records emit them, their order and uniqueness, the always-present subjects, and what each member must say.
