# src/render/inspection/AutoMovieInspectionShade.ts#AutoMovieInspectionShade

## @evidence contracts/development/design.md#principled-representation

The guide passes keep the names the interface gives them, and the two shades that exist only for inspection extend that union instead of renaming any of it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Headless capture pass planning, inspection parsing and surface drawing share this closed vocabulary; viewer actions consume the value without owning its semantics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The ordinary render is the `beauty` member of the same union, not an absent value with a second meaning.

## @evidence contracts/development/common.md#meaningful-documentation

States what each inspection shade replaces, what lights it and what it reveals, and that the pose pass is not narrowed by a selection.
