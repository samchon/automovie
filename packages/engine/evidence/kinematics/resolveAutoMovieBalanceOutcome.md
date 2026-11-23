# src/kinematics/resolveAutoMovieBalanceOutcome.ts#resolveAutoMovieBalanceOutcome

## @evidence contracts/development/common.md#meaningful-documentation

States the impulse's effect, the pendulum, the absorb condition with its source, the capture point's divergence, the stepping recurrence with its sources and fixed point, where steps are laid and the bounds.

## @evidence contracts/development/implementation.md#principled-implementation

Hof's extrapolated centre against the support polygon for absorption; the linear inverted pendulum's capture point diverging from a centre of pressure held at the base's edge until the first landing and at each landed foot's front edge between swings, the N-step capture of Koolen et al.'s framework (located, not yet read at the source), whose fixed point is the infinite-step capture distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The state after the impulse, the absorb test, the stepping recurrence, the bounds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No count of steps is assumed: the recurrence itself ends in a catch or diverges, so the outcome follows from the impulse alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hull of the support and a recurrence whose length is the number of steps it lays. Each step must strictly shrink the distance left; one that does not (the distance within rounding of the fixed point, or an overflowed swing divergence whose fixed point's limit is reach + margin) is the fixed point's fall, so the recurrence, whose distance below the fixed point grows a-fold a step, ends within about log_a(d* / (d* - left)) steps, or left / (reach + margin) where the divergence rounds to a = 1.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
