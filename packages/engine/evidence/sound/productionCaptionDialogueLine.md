# src/sound/productionCaptionDialogueLine.ts#productionCaptionDialogueLine

## @evidence contracts/development/implementation.md#principled-implementation

A line with adopted speech ends where its samples end on the plan's 48 kHz clock, by the same nearest-tick boundary rule the mixer places it with (`productionSpeechEndFrame`); a line without speech keeps its caption window.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Extracted from `deriveProductionSoundPlan` as the one lowering of a caption to a dialogue line, so the plan reads as its events, cues and dialogue.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A caption ending before its speech and a speech span past the film's last frame throw instead of being trimmed, because either would cut off a line that is still playing.

## @evidence contracts/development/common.md#meaningful-documentation

States both spans, where the speech end comes from, both refusals and why each is refused.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One map lookup and the speech end's bounded search per caption.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Lowers one caption per call; nothing is shared between captions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned line, which copies the caption's scalar fields.
