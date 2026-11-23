# src/motion/IAutoMovieCrowdAgent.ts#IAutoMovieCrowdAgent

## @evidence contracts/development/common.md#meaningful-documentation

States what an agent is, its units and frames, and that it carries no vocabulary.

## @evidence contracts/development/design.md#principled-representation

The agent of the social force model (Helbing and Molnar 1995): a position, a goal, a radius and a desired speed, with the start second and herding share of Helbing, Farkas and Vicsek 2000.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns the planar agent contract consumed by steerAutoMovieCrowd; motion planners build agents from their own performers and objects.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A goal is a point or an ordered list of points, never a scripted course; the course is the pass's output.

# src/motion/IAutoMovieCrowdAgent.ts#IAutoMovieCrowdAgent.IObstacle

## @evidence contracts/development/common.md#meaningful-documentation

States its footprint's frame with and without a motion, and that a motion is pure.

## @evidence contracts/development/design.md#principled-representation

A convex footprint on the floor plan and an optional rigid placement by film second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two members the pass reads; the motions package maps its obstacles onto it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A still obstacle carries no motion rather than a constant function.

# src/motion/IAutoMovieCrowdAgent.ts#IAutoMovieCrowdAgent.ICourse

## @evidence contracts/development/common.md#meaningful-documentation

States the reader's units, the held ends and the meaning of a null arrival.

## @evidence contracts/development/design.md#principled-representation

A course read by film second, and the first second within its radius of its destination.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What HumanCrowd.steer and the props planner read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No arrival is invented: an agent that does not arrive reads null.

# src/motion/IAutoMovieCrowdAgent.ts#IAutoMovieCrowdAgent.IContact

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The two parties by index, when the overlap began and how deep it was.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a caller names in its refusal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The other party is a discriminated agent-or-obstacle index, so the array owning the index is explicit.
