# src/motion/human/grappling/IAutoMovieMotionHumanForceResponse.ts#IAutoMovieMotionHumanForceResponse.Outcome

## @evidence contracts/development/common.md#meaningful-documentation

A response a pull can be met with.

## @evidence contracts/development/design.md#principled-representation

Closed choices "resist", "yield", "thrown" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: grappling/HumanForceResponse.ts (HumanForceResponse.plan, chosen).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanForceResponse.plan.

# src/motion/human/grappling/IAutoMovieMotionHumanForceResponse.ts#IAutoMovieMotionHumanForceResponse.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The author's outcome and, for a throw, the thrower and the fulcrum region it turns over.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members; the outcome is the author's through `perturb`, and the pull is the force input, never a parameter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A throw's fulcrum is named, not guessed from the bodies.
