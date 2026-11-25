# src/human/generation/IAutoMovieHumanBreastFrame.ts#IAutoMovieHumanBreastFrame.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the frame reads.

## @evidence contracts/development/design.md#principled-representation `apex`: The bust point on the wall, `[x, y, z]`, mm (ISO 8559-1 3.1.11, a bare breast's most anterior point). `tangent`: The wall's section tangent at the apex in `[x, z]`, in the direction of rising phase (front: z rising).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBreastFrame.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `apex`, `tangent`; callers supply the complete record.
