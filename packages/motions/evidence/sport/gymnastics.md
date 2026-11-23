# src/sport/gymnastics.ts#gymnastics.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The hips carry the root while the feet stand and the shoulders pivot it while the hands bear, so neither support slides; the shoulders' height is the arms' reach above the laid hands' wrists; the feet stay planted for the first half and then ride the straight legs of the pitched body.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clock, root row, arm rows, leg rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Lengths are the body's; provisional values named.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture solve per arm per second remains. Each root primitive reads its fold/swing once and computes only its active hip or shoulder support placement, avoiding an unused heading rotation; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the placed arm, leg placement and posture heading; the root writer shares its same-query clock weights between pitch and the selected support without retaining a temporal result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan closes over the clock and a few points.
