# src/human/generation/IAutoMovieHumanMouthArch.ts#IAutoMovieHumanMouthArch.IArch

## @evidence contracts/development/common.md#meaningful-documentation

A beta arch fitted to one quadrant's teeth.

## @evidence contracts/development/design.md#principled-representation `width`: Full width between the arch's ends, mm. `depth`: Depth from the ends' line to the front, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanMouthArch.arch. Read by AutoMovieHumanMouthArch.place, AutoMovieHumanMouthArch.beta, AutoMovieHumanMouthArch.walk. Also types AutoMovieHumanMouth.upperArch, AutoMovieHumanMouthArch.sized.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `width`, `depth`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanMouthArch.ts#IAutoMovieHumanMouthArch.PlaceEdge

## @evidence contracts/development/common.md#meaningful-documentation

Teeth of one jaw, both sides, on the upper arch inset by an offset.

## @evidence contracts/development/design.md#principled-representation

Teeth of one jaw, both sides, on the upper arch inset by an offset. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanMouthArch.PlaceEdge is the canonical exchange used by AutoMovieHumanMouthArch.place.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanMouthArch.place for teeth of one jaw, both sides, on the upper arch inset by an offset.
