# src/animals/QuadrupedTimedRoute.ts#QuadrupedTimedRoute.IRoute

## @evidence contracts/development/common.md#meaningful-documentation

States both members.

## @evidence contracts/development/design.md#principled-representation

The plan and its course of legs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/QuadrupedTimedRoute.ts#QuadrupedTimedRoute.of

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A timed plan becomes one leg naming no gait at its peak speed; its zero-speed marks become stop and depart instants, and the shortest ramp through the slowest gait's least speed sets the rate of the clock's stop bridge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the halts, then build the plan and the course.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; the plan is ridden as given.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(K) marks, each with a 10 ms scan of its ramp.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the plan's samplers and AutoMovieArchetypeCourse.plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the plan and a small course.
