# src/motion/human/compose/IAutoMovieMotionHumanPrimitive.ts#IAutoMovieMotionHumanPrimitive

## @evidence contracts/development/common.md#meaningful-documentation

States primitive input/output ownership and the companion Reader's action-local seconds, optional channel demand and borrowed partial-result boundary.

## @evidence contracts/development/design.md#principled-representation

A part's movement is a function from the posture so far and the time to a posture, over a span and on declared channels; an action is such functions side by side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The claim, optional input dependencies, span, writer and optional planning, contacts and weapons serve the composer; omitted dependencies preserve complete input reads. The writer's trailing evaluation is the composed plan's own explicit context, so no writer has a hidden contextual counterpart.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the plan's contact-window and weapon types; the two optional members are absent for a primitive that makes neither.

# src/motion/human/compose/IAutoMovieMotionHumanPrimitive.ts#IAutoMovieMotionHumanPrimitive.Reader

## @evidence contracts/development/common.md#meaningful-documentation

States action-local seconds, optional channel demand, synchronous FK/ROM loans and borrowed partial result ownership.

## @evidence contracts/development/design.md#principled-representation

The plan-owned posture signature describes the same seconds/channel/metadata inputs of a prefix observation; only demanded values may be inspected.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both preparation and writing reuse IAutoMovieMotionHumanActionPlan.posture's existing signature, with no parallel metadata or posture record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Omission preserves complete reads and current query loans; explicit changed loans receive a separate query scope rather than certifying another context's result.
