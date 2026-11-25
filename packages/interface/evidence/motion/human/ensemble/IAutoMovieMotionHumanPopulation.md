# src/motion/human/ensemble/IAutoMovieMotionHumanPopulation.ts#IAutoMovieMotionHumanPopulation.ICycle

## @evidence contracts/development/common.md#meaningful-documentation

Defines the period and travel of a stepping or held standing take and the pose frame and phases.

## @evidence contracts/development/design.md#principled-representation

Consistent evenly spaced phases let the consumer use one stride, period and sequence of canonical poses for either take.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanPopulation.cycle and HumanPopulation.standing return the same record for the population's pose-table consumer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMoviePose identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanPopulation.ts#IAutoMovieMotionHumanPopulation.IDesignProps

## @evidence contracts/development/common.md#meaningful-documentation

id: Identifier assigned to the resulting instanced formation design. model: Model-group identifier used by the population renderer. seconds: Performance second at which to read the formation frame; defaults to 0.

## @evidence contracts/development/design.md#principled-representation

id: Identifier assigned to the resulting instanced formation design. model: Model-group identifier used by the population renderer. seconds: Performance second at which to read the formation frame; defaults to 0.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanPopulation.ts (HumanPopulation.design, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanPopulation.design.
