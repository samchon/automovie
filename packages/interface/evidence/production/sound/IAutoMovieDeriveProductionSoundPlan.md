# src/production/sound/IAutoMovieDeriveProductionSoundPlan.ts#IAutoMovieDeriveProductionSoundPlan.IEventCue

## @evidence contracts/development/common.md#meaningful-documentation

Defines the shot-local target, signed frame offset, source-relative onset, and mix clock.

## @evidence contracts/development/design.md#principled-representation

Combines the common normalized source trim and gain fields with a shot-event reference and a signed whole-frame displacement from each retained picture occurrence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses fixed cue payload fields and replaces only the film start with shot, event and frame offset.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The planner checks the declared asset, source trim and film placement. Decoded PCM remains a separate mix input.

# src/production/sound/IAutoMovieDeriveProductionSoundPlan.ts#IAutoMovieDeriveProductionSoundPlan.IProps

## @evidence contracts/development/design.md#principled-representation

Sample times are shot-local seconds rounded with Math.round(time * timeline.fps) to source frames, then translated through [sourceInFrame, sourceOutFrame) trims into film frames. The output uses 48000 Hz stereo metadata.

## @evidence contracts/development/design.md#minimal-and-owned-surface

deriveProductionSoundPlan consumes contracts for semantic event subjects, compiled scenes for spatial source/listener data and normalized audio/caption tracks for cue/dialogue placement. Optional event cues share the source trim and resolve on the retained picture event frame. The optional speech sample counts exist because the planner takes no PCM: they are the only way it can place a spoken line over its real length.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing shot records, camera, sampled event declarations or all spatial sources throw. Unresolved members of an otherwise resolved subject group are skipped; the result does not certify each declared subject resolved. A caption ending before its speech and a speech span past the film are refused rather than clipped.

## @evidence contracts/development/common.md#meaningful-documentation

Compiled edit and shot evidence used to derive a finished-film sound plan. Sample times are shot-local seconds rounded with Math.round(time * timeline.fps) to source frames, then translated through [sourceInFrame, sourceOutFrame) trims into film frames. The output uses 48000 Hz stereo metadata.
