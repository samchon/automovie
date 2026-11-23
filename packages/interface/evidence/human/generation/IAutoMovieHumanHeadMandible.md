# src/human/generation/IAutoMovieHumanHeadMandible.ts#IAutoMovieHumanHeadMandible

## @evidence contracts/development/common.md#meaningful-documentation

The person's mandible, calibration millimetres.

## @evidence contracts/development/design.md#principled-representation `front`: Arch's front apex on the midline. `gonion`: Gonion's place along the face's forward axis. `gonionY`: Gonion's height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadMandible is the canonical exchange used by IAutoMovieHumanHeadLayout, IAutoMovieHumanHeadSection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `front`, `gonion`, `gonionY`, `width`, `back`, `radius`, `origin`, `side`, `start`, `end`, `spread`, `chin`, `menton`, `slope`, `cos`, `lean`, `height`, `draft`, `round`, `taper`, `blend`, `throat`; callers supply the complete record.
