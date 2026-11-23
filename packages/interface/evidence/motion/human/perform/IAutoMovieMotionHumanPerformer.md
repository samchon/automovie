# src/motion/human/perform/IAutoMovieMotionHumanPerformer.ts#IAutoMovieMotionHumanPerformer

## @evidence contracts/development/common.md#meaningful-documentation

at: Starting floor point, world metres. yaw: Starting heading about +Y, degrees. attributes: The person's group attributes, each in [0, 1], drawn by an ensemble (`HumanEnsemble.performers`) or given; an attribute absent reads as its neutral value, which the reader of `HUMAN_ATTRIBUTE_EFFECTS` names. Laws and layers read them from their context; none changes an outcome.

## @evidence contracts/development/design.md#principled-representation

at: Starting floor point, world metres. yaw: Starting heading about +Y, degrees. attributes: The person's group attributes, each in [0, 1], drawn by an ensemble (`HumanEnsemble.performers`) or given; an attribute absent reads as its neutral value, which the reader of `HUMAN_ATTRIBUTE_EFFECTS` names. Laws and layers read them from their context; none changes an outcome.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.performers, return); perform/HumanPerformanceKey.ts (HumanPerformanceKey.of, p); perform/HumanPerformanceKey.ts (HumanPerformanceKey.of, return); audit/HumanVerdicts.ts (HumanVerdicts.of); perform/HumanPerformance.ts (HumanPerformance); perform/HumanPerformanceState.ts (HumanPerformanceState).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieVector3, IAutoMovieProficiency identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
