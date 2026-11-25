# src/tasks/useToolTarget.ts#useToolTarget

## @evidence contracts/development/common.md#meaningful-documentation

States its input, the knots it prepares, the path between them and the grip goal a read returns.

## @evidence contracts/development/implementation.md#principled-implementation

Via-point trajectory generation: the arm's bend (`AutoMovieMotionHumanBend.solve` on the entry's trunk) is solved only at the cycle's knots, its quarter phases, where every tool cycle's sinusoid is at an extreme or an inflection; between knots the bend runs on the minimum-jerk path through them (Flash and Hogan 1985, J Neurosci 5(7):1688-1703) in its periodic form, the shared owner `HumanMinimumJerkSpline.cyclic`, whose jerk and snap are continuous at every knot and across the cycle's wrap. The wrist goal is the cycle's, unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare once, read by time: the knots and their path derivatives are the plan's preparation; the returned reader only evaluates the cycle and the path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The knot count is the sinusoid's extremes and inflections, not a tuned value; the bend is a hint for the arm's own fit, which still enforces reach and range.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four bend solves and one periodic spline solve per plan; each read is one cycle evaluation and one quintic, with no solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The edge outside the work holds the half-phase knot, the same wrist goal; the spline is the shared owner's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds the four knots and their derivatives for the plan's life; nothing grows with reads.

# src/tasks/useToolTarget.ts#useToolTarget.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it carries.

## @evidence contracts/development/design.md#principled-representation

The work's cycle and instants in seconds, the body, side and grip offset, and the entry posture the bends are solved on.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `useToolTarget.of`; the types are imported from their owners.

## @evidenceExclude contracts/development/design.md#prohibited-design-shortcuts

Every member is required; no optional combination arises.

# src/tasks/useToolTarget.ts#useToolTarget.course

## @evidence contracts/development/common.md#meaningful-documentation

States its inputs and the place it returns.

## @evidence contracts/development/implementation.md#principled-implementation

The minimum-jerk segment between the two knots around the phase, evaluated by the shared owner's quintic (`HumanMinimumJerkSpline.quintic`, Flash and Hogan 1985), the last segment wrapping to the first knot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility: evaluating the prepared periodic path at a phase.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

An exact polynomial evaluation; nothing is tuned.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one segment lookup and one quintic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shared spline owner's evaluation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; it retains nothing.
