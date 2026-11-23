# src/motion/human/AutoMovieMotionHumanActionName.ts#AutoMovieMotionHumanActionName

## @evidence contracts/development/common.md#meaningful-documentation

Closed vocabulary of the human actions an author chains: every law the package ships has exactly one name here, and a chain, an interrupt table or a legality rule refers to actions only by these names. The list grows additively as laws land; a name is never repurposed.

## @evidence contracts/development/design.md#principled-representation

One closed action-name union keys the action parameter map, shipped law registry, chain calls and interrupt tables; the runtime registry is checked against the declared names.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/HUMAN_ACTIONS.ts (HUMAN_ACTIONS); actions/jump.ts (jump.name); actions/run.ts (run.name); actions/stand.ts (stand.name); actions/support.ts (support.name); actions/walk.ts (walk.name).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HUMAN_ACTIONS.
