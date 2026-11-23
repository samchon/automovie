# src/human/generation/hand/IAutoMovieHumanMetacarpalArch.ts#IAutoMovieHumanMetacarpalArch.IInput

## @evidence contracts/development/common.md#meaningful-documentation

An arch's fixed inputs.

## @evidence contracts/development/design.md#principled-representation `centre`: The metacarpal axis's place in the section, `[b, c]`, mm. `root`: The finger root's skin half width, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanMetacarpalArch.radius, AutoMovieHumanMetacarpalArch.arc.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `centre`, `root`; callers supply the complete record.

# src/human/generation/hand/IAutoMovieHumanMetacarpalArch.ts#IAutoMovieHumanMetacarpalArch.ArcResult

## @evidence contracts/development/common.md#meaningful-documentation

Points of the dorsal arc between two angles about the metacarpal axis, angle 0 toward the thumb along `b` and increasing toward the back of the hand (`-c`).

## @evidence contracts/development/design.md#principled-representation

Points of the dorsal arc between two angles about the metacarpal axis, angle 0 toward the thumb along `b` and increasing toward the back of the hand (`-c`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanMetacarpalArch.ArcResult is the canonical exchange used by AutoMovieHumanMetacarpalArch.arc.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanMetacarpalArch.arc for points of the dorsal arc between two angles about the metacarpal axis, angle 0 toward the thumb along `b` and increasing toward the back of the hand (`-c`).
