# src/formationCadenceSegments.ts#formationCadenceSegments

## @evidence contracts/development/implementation.md#principled-implementation

A piecewise integral over `[0, time]`: each cue's distance is its displacement times the difference of eased progress at the interval's ends, using the sampler's own `ease` and its rule that a finished cue sits at progress one, so a `step` cue's displacement lands at its end; it relies on formation easings being monotone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass emitting gap and cue intervals through a local `hold`, leaving the per-tier stride folding to the viewer's `applyFormationCycleCadence`, which knows each figure's stride.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Gaps carry no distance because the sampler's jump between cues is not walked travel, a stated rule rather than a correction, and no gait or cue is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States the distance law and its shared progress, the gap rule and gait retention, why turn is separate, the cue order and its malformed-input behavior, and the negative-time result.

## @evidence contracts/development/implementation.md#efficient-algorithms

One filter over all motions and one sort of the unit's `m` cues, `O(M + m log m)`, then a single pass that stops at the first cue starting after `time`; the viewer calls it once per formation per frame, and recomputing from the cue list is what keeps a seek exact.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Shares nothing across calls by design: every frame derives the segments from the cue list and the time alone so nothing accumulates between frames.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned list holds at most two segments per cue started before `time` plus one trailing gap and belongs to the caller.
