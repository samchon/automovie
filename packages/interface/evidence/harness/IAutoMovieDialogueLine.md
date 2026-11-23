# src/harness/IAutoMovieDialogueLine.ts#IAutoMovieDialogueLine

## @evidence contracts/development/design.md#principled-representation

A speaker, verbatim text and an optional beat-local time are the facts a screenplay line prints, and `renderScreenplay` formats them in the conventional centred-name layout without interpreting the text.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The line holds no audio, viseme or duration field, because those belong to the production dialogue records that sound and lip-sync read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The speaker is not resolved against the cast, a gap stated on the field, and `null` is the only spelling of a floating line, so no sentinel time stands in for it.

## @evidence contracts/development/common.md#meaningful-documentation

States the one reader and its output form, which records other passes read instead, and the validators' rules; members give the speaker scope, verbatim text, and the anchor's unit, range and null meaning.
