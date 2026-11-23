# src/render/IAutoMovieCaptionEntry.ts#IAutoMovieCaptionEntry

## @evidence contracts/development/design.md#principled-representation

A half-open frame interval is the representation that lets consecutive spans share a boundary without overlap, so the spans tile the output frames exactly and slicing can clip them with `max` and `min`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The span repeats the `IAutoMovieBeatCaption` fields beside the beat id and range, so a consumer reads one flat record without a second lookup into the screenplay.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field carries a consumer-specific default prompt; null caption and slug are left for the consumer to interpret.

## @evidence contracts/development/common.md#meaningful-documentation

The prose gives the interval convention and how a consumer uses each field, and each member states its bound, its frame of reference, or its null cases.
