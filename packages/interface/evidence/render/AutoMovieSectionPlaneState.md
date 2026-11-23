# src/render/AutoMovieSectionPlaneState.ts#AutoMovieSectionPlaneState

## @evidence contracts/development/design.md#principled-representation

Three states derived per plane from the signed distance of the box's two extreme corners, the exact extremes of a linear function over a box: one plane with both extremes on the removed side gives `cut`, all planes with the removed-side extreme at or below zero give `kept`, and anything else gives `crossed`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed union of the three facts the classifier can establish without clipping polytopes, rather than a boolean visibility that would need the multi-plane intersection it does not compute.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `crossed` is not upgraded to "visible" or downgraded to "cut" by a heuristic; the multi-plane gap is stated in the state's meaning instead of being guessed.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the condition for each state, that touching is kept, and that `crossed` does not guarantee a surviving point and why.
