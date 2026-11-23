# src/scene/filmResponse/AutoMovieFilmAlpha.ts#AutoMovieFilmAlpha

## @evidence contracts/development/design.md#principled-representation

The two ways a picture over a transparent clear keeps alpha: the beauty layer, whose alpha includes a medium's opacity, and the graphics plate, whose alpha is its graphics' coverage by the plate's contract; absence where it is taken is the opaque picture.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The response stage, the sample accumulation and the medium pass read it; the draw page passes `transparent` for a transparent beauty draw and `coverage` for the plate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union of the two modes the draw page uses; opaque is absence, not a third value that every caller would have to pass.

## @evidence contracts/development/common.md#meaningful-documentation

States both modes, what the medium and glare do in each, that the response acts on straight colour, where a composite after the response matches the opaque picture, and why a glare halo beyond coverage falls to nothing in straight output.
