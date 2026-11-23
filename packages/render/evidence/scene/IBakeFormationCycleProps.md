# src/index.ts#IBakeFormationCycleProps

## @evidence contracts/development/design.md#principled-representation

Supplies one compiled figure, its rest-positioned built model and ordered rigid parts so bakeFormationCycle can measure posed matrices against exactly the rest geometry extracted for instancing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps model semantics, mutable playback target and ordered drawable parts explicit rather than rediscovering traversal order inside each gait sample.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sampling uses the model's actual gait and skeleton through applyPose; no preauthored motion table is embedded in these bake inputs.

## @evidence contracts/development/common.md#meaningful-documentation

States rest/world-matrix prerequisites, extraction-before-bake order, final-pose mutation and default cycle-sample behavior.
