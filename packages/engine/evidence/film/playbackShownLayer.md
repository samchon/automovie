# src/film/playbackShownLayer.ts#playbackShownLayer

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the tie, what each transition shows when, which records follow it and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A per-frame record names the shot the picture shows most of, the larger compositing weight; on a tie the incoming shot, the one the cut moves to.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over at most two layers; the weights stay `playbackLayersAt`'s.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An empty layer list is refused rather than answered with an invented shot.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure selection.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds nothing.