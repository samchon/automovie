# src/production/IAutoMovieProductionDialogueLine.ts#IAutoMovieProductionDialogueLine

## @evidence contracts/development/design.md#principled-representation

A line is a half-open interval on the film-frame clock. For a line with adopted speech the interval is its speech span, derived from its sample count by `productionSpeechEndFrame`, so the mixer, the ducking envelope and the viseme mapping all read the line's real extent; an unspoken caption keeps its caption window. Frame integrality and order are checked by the mixer and the join at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns it; the timeline planner and render's sound-list route produce it, and the mixer, ducking envelope and viseme join read it. It carries only line content and placement, leaving bytes and receipts to their own records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Omitted speaker remains unspecified rather than defaulted; the same interval type serves spoken and unspoken lines because every consumer reads both the same way.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the speech span, which lines keep a caption window, id uniqueness, text, language, speaker, and the inclusive-start exclusive-end frames.
