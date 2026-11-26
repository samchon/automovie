# src/human/generation/f1/IAutoMovieHumanF1SegmentLengths.ts#IAutoMovieHumanF1SegmentLengths.IBones

## @evidence contracts/development/common.md#meaningful-documentation

Three bone lengths beyond a hand digit's first joint, in millimetres.

## @evidence contracts/development/design.md#principled-representation

The fixed tuple distinguishes the two later joint offsets and the distal tip offset in their anatomical order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanF1SegmentLengths reads this tuple for each hand digit when rebuilding its local offsets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The length domain and required digit keys remain runtime premises.

# src/human/generation/f1/IAutoMovieHumanF1SegmentLengths.ts#IAutoMovieHumanF1SegmentLengths.IFields

## @evidence contracts/development/common.md#meaningful-documentation

Segment lengths and extremity breadths for the reference-family figure, in millimetres.

## @evidence contracts/development/design.md#principled-representation

Named lengths identify their segment endpoints. Extremity breadths use the declared hand and foot axes. The segment placement owner admits numeric values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Family placement and native field construction share these complete inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A length field is an authored skeletal displacement. Nothing in the record supplies a measured skin girth.
