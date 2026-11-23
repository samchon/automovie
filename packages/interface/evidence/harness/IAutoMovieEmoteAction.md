# src/harness/IAutoMovieEmoteAction.ts#IAutoMovieEmoteAction

## @evidence contracts/development/design.md#principled-representation

The synthesizer writes the same expression at the clip's first and last keyframe with linear easing, so the preset holds constant over the span and the face region's lane carries it alone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A named preset and one strength are enough to state an emotion; blendshape weights are left to the renderer's preset mapping instead of being authored per action.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The synthesized base has no ramp and out-of-range intensity is refused. Composite layering and rest lead-in can introduce linear boundary transitions over up to 1e-6 seconds; this base-clip shape therefore does not guarantee an exact discontinuous onset or offset in assembled playback. Visible morphing also requires matching model targets.

## @evidence contracts/development/common.md#meaningful-documentation

States the region and what an override does, the exact clip shape and `"auto"` length, the absent ramp, and the intensity refusal; members give the preset role and the intensity scale.
