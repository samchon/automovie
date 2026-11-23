# src/motion/human/throwing/IAutoMovieMotionHumanThrowObjectLever.ts#IAutoMovieMotionHumanThrowObjectLever

## @evidence contracts/development/common.md#meaningful-documentation

kind: Turns chosen by the act. prop: The implement's subject id, held in the throwing hand at the throw's entry. point: The affordance the thrown prop rides: an atlatl's spur, a sling's pouch.

## @evidence contracts/development/design.md#principled-representation

kind: Turns chosen by the act. prop: The implement's subject id, held in the throwing hand at the throw's entry. point: The affordance the thrown prop rides: an atlatl's spur, a sling's pouch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: throwing/throwObjectLever.ts (throwObjectLever.of, props); throwing/throwObject.ts (throwObject.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in throwObjectLever.of.

# src/motion/human/throwing/IAutoMovieMotionHumanThrowObjectLever.ts#IAutoMovieMotionHumanThrowObjectLever.ITurns

## @evidence contracts/development/common.md#meaningful-documentation

States what the act derives.

## @evidence contracts/development/design.md#principled-representation

One tag beside the engine's attitudes, resolved to a `spin` before the launch is published.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The tag alone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The author types no rate or axis.

# src/motion/human/throwing/IAutoMovieMotionHumanThrowObjectLever.ts#IAutoMovieMotionHumanThrowObjectLever.IImplement

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

A held prop and the affordance of its working point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members read by `of`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No implement kind is named; the point is the archetype's affordance id.
