# src/motion/arrangeMotion.ts#arrangeMotion

## @evidence contracts/development/implementation.md#principled-implementation

Stable start sorting followed by strictly increasing insertion implements sequential placement; a gap repeats the previous tail at the next start, and the final placement's gait clock is shifted by positive modulo for beat-end handoff. Individual clips must already have ordered finite keyframes on one skeleton.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The composer owns timeline offset, gap holding and final-cycle propagation; interpolation remains sampleMotion's responsibility.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Start/duration/keyframe-population admission throws on invalid placement data; documented overlap dropping preserves the existing sequential contract instead of pretending to blend concurrent clips.

## @evidence contracts/development/common.md#meaningful-documentation

States start ordering, gap hold, overlap dropping, non-looping output, empty result and the admitted same-rig clip premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sorts P placements in O(P log P), then processes K input keyframes once with O(P+K) temporary/output storage; no per-frame resampling is needed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shifted frames share their existing pose/expression records; the last placement's completed gait metadata is reused with only its clock offset changed, and no cross-call cache is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the new clip/keyframe array; nested pose/expression data remain shared with input clips, and sorted/shifted temporary arrays become collectible on completion or throw.
