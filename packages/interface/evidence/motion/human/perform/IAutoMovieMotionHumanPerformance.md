# src/motion/human/perform/IAutoMovieMotionHumanPerformance.ts#IAutoMovieMotionHumanPerformance

## @evidence contracts/development/common.md#meaningful-documentation

duration: Seconds from 0 to the last action's end. state: One input per coupled degree of freedom a prop's acts or tracks have moved by a film second (`HumanPerformanceObject.state`), in the latest begun writer's coordinate. A later writer of another coordinate of the same degree replaces the old one; after its end its last travel holds. A degree absent from the record starts at its leader's zero. hits: Every hit of the performance in time order, or those on one person or prop (`HumanPerformanceHits`): melee stops, blasts and flights' first contacts, each as the one shared interaction record. rules: The production's legality rules, such as `KickboxingRules.rules`, checked against the placed schedule with the engine's `checkAutoMovieLegality`; any violation refuses the performance with every broken rule in the message. None when absent. forces: Forces on the performers (#3429): impulses at an instant and forces sustained over a span, read by the reactions the composition places (`IAutoMovieMotionHumanActionContext.forces`). A force starts no action. None when absent. obstacles: What stands in the performers' way: the scene's walls and solid objects with their openings (`HumanObstacle`). A law that moves a body across the floor reads them through its context and refuses a path through a solid; none when absent, and then every path is free.

## @evidence contracts/development/design.md#principled-representation

duration: Seconds from 0 to the last action's end. state: One input per coupled degree of freedom a prop's acts or tracks have moved by a film second (`HumanPerformanceObject.state`), in the latest begun writer's coordinate. A later writer of another coordinate of the same degree replaces the old one; after its end its last travel holds. A degree absent from the record starts at its leader's zero. hits: Every hit of the performance in time order, or those on one person or prop (`HumanPerformanceHits`): melee stops, blasts and flights' first contacts, each as the one shared interaction record. rules: The production's legality rules, such as `KickboxingRules.rules`, checked against the placed schedule with the engine's `checkAutoMovieLegality`; any violation refuses the performance with every broken rule in the message. None when absent. forces: Forces on the performers (#3429): impulses at an instant and forces sustained over a span, read by the reactions the composition places (`IAutoMovieMotionHumanActionContext.forces`). A force starts no action. None when absent. obstacles: What stands in the performers' way: the scene's walls and solid objects with their openings (`HumanObstacle`). A law that moves a body across the floor reads them through its context and refuses a path through a solid; none when absent, and then every path is free.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/HumanVerdicts.ts (HumanVerdicts.of, performance); audit/HumanVerdicts.ts (remember, performance); ensemble/HumanPopulation.ts (HumanPopulation.cycle, performance); executable/cases/affectionCases.ts (affectionCases.run, return); executable/cases/affectionCases.ts (affectionCases.performance, return); executable/cases/affectionCases.ts (attempt, run).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieSchedule, IAutoMovieMotionHumanPerformer, IAutoMoviePose, IAutoMovieMotionHumanPosture, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical IAutoMovieMotionHumanPerformer, IAutoMovieMotionHumanProp, IAutoMovieComposition, IAutoMovieCheckLegality.IRule, IAutoMovieMotionHumanActionLaw identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanPerformance.ts#IAutoMovieMotionHumanPerformance.IConstructor

## @evidence contracts/development/common.md#meaningful-documentation

The callable constructor and static factories.

## @evidence contracts/development/design.md#principled-representation

A single input describes seed, performers, props and composition; runtime construction resolves and validates them before exposing the performance queries.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used by the enclosing IAutoMovieMotionHumanPerformance contract's parameter and result relationships.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanPerformance.IInput, IAutoMovieMotionHumanPerformance identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanPerformance.ts#IAutoMovieMotionHumanPerformance.IInput

## @evidence contracts/development/common.md#meaningful-documentation

rules: The production's legality rules, such as `KickboxingRules.rules`, checked against the placed schedule with the engine's `checkAutoMovieLegality`; any violation refuses the performance with every broken rule in the message. None when absent. forces: Forces on the performers (#3429): impulses at an instant and forces sustained over a span, read by the reactions the composition places (`IAutoMovieMotionHumanActionContext.forces`). A force starts no action. None when absent. obstacles: What stands in the performers' way: the scene's walls and solid objects with their openings (`HumanObstacle`). A law that moves a body across the floor reads them through its context and refuses a path through a solid; none when absent, and then every path is free.

## @evidence contracts/development/design.md#principled-representation

rules: The production's legality rules, such as `KickboxingRules.rules`, checked against the placed schedule with the engine's `checkAutoMovieLegality`; any violation refuses the performance with every broken rule in the message. None when absent. forces: Forces on the performers (#3429): impulses at an instant and forces sustained over a span, read by the reactions the composition places (`IAutoMovieMotionHumanActionContext.forces`). A force starts no action. None when absent. obstacles: What stands in the performers' way: the scene's walls and solid objects with their openings (`HumanObstacle`). A law that moves a body across the floor reads them through its context and refuses a path through a solid; none when absent, and then every path is free.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: executable/cases/affectionCases.ts (performers, return); perform/HumanPerformanceKey.ts (HumanPerformanceKey.of, input); perform/HumanPerformanceSchedule.ts (HumanPerformanceSchedule.resolve, input); perform/HumanPerformanceState.ts (HumanPerformanceState.of, input); perform/HumanPerformance.ts (HumanPerformance); perform/HumanPerformanceState.ts (HumanPerformanceState).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanPerformer, IAutoMovieMotionHumanProp, IAutoMovieComposition, IAutoMovieCheckLegality.IRule, IAutoMovieMotionHumanActionLaw identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
