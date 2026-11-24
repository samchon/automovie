# src/production/sound/IAutoMovieDialogueMouth.ts#IAutoMovieDialogueMouth

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is, the silent value and why it sets no channel; each member states its unit or range, which representation takes it and where its value comes from.

## @evidence contracts/development/design.md#principled-representation

The two mouth forms the representations take at one second: a jaw opening in millimetres within the envelope jaw's range, and MPEG-4 viseme weights in [0, 1] summing to 1.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by engine's `sampleAutoMovieDialogueMouth`; the draw page's recorder hands each form to the subject on request.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both forms are always present, so no optional member combines into a meaningless state; the Human's viseme shapes stay with #3185.
