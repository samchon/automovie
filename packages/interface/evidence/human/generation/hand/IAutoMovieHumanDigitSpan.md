# src/human/generation/hand/IAutoMovieHumanDigitSpan.ts#IAutoMovieHumanDigitSpan.Phalanx

## @evidence contracts/development/common.md#meaningful-documentation

Which phalanx.

## @evidence contracts/development/design.md#principled-representation

Which phalanx. The closed alternatives are "proximal", "middle", "distal".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanDigitSpan.shape. Also types AutoMovieHumanDigitProfile.phalanx, AutoMovieHumanDigitSpan.START.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanDigitProfile.phalanx, AutoMovieHumanDigitSpan.START, AutoMovieHumanDigitSpan.shape for which phalanx.

# src/human/generation/hand/IAutoMovieHumanDigitSpan.ts#IAutoMovieHumanDigitSpan.IKnot

## @evidence contracts/development/common.md#meaningful-documentation

The three shares at one station, over the root half width.

## @evidence contracts/development/design.md#principled-representation `width`: Half width. `palmar`: Palmar depth from the bone. `dorsal`: Dorsal depth from the bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanFootToeTaper.knots, AutoMovieHumanFootToeTaper.first.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `width`, `palmar`, `dorsal`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanDigitSpan.ts#IAutoMovieHumanDigitSpan.IInput

## @evidence contracts/development/common.md#meaningful-documentation

A span's fixed inputs.

## @evidence contracts/development/design.md#principled-representation `root`: The finger's root half width, mm. `apex`: Section palmar apex share, as a share of the ellipse's curvature (1 is the ellipse).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanDigitSpan.shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `root`, `apex`; callers supply the complete record.
