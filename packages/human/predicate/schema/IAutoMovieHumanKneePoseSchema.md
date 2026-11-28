# src/schema/IAutoMovieHumanKneePoseSchema.ts#IAutoMovieHumanKneePoseSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration states the signed directions and distinguishes the nominal input ranges from the flexion-dependent interval used during clamped evaluation.

## @evidence contracts/development/design.md#principled-representation

Typia checks flexion in [-1.3, 139.8] degrees and nominal rotation in [-25, 35]. Human scales the latter by flexion divided by 90, bounded to [0, 1], when evaluation clamps the pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The leg schema carries one optional knee record. Only the evaluator combines the two angles to determine the applied bounds.
