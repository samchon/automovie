# src/core/IAutoMovieTrack.ts#IAutoMovieTrack

## @evidence contracts/development/design.md#principled-representation

sampleClip checks track shape before binary segment lookup and glTF interpolation. clipTrackShapeFaults refuses empty/nonfinite arrays, unordered or negative times and malformed fixed-width/cubic strides; its upper-time bound applies only when clip duration is positive, so sampler-supported zero duration does not enforce that bound.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Flat parallel arrays keep a track a direct copy of a glTF accessor pair, and the per-keyframe width comes from the channel rather than a stored stride, so one record shape serves every channel kind.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A malformed track throws its first fault rather than being skipped or padded, and the width of a `weights` channel, which the track cannot know, is reported as unchecked instead of assumed.

## @evidence contracts/development/common.md#meaningful-documentation

States the clock and units of `times`, the value layout and width rule including the cubic triplet and tangent units, the hold behavior outside the keys, each interpolation's evaluation, and what makes sampling throw.
