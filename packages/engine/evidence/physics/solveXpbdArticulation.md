# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation

## @evidence contracts/development/common.md#meaningful-documentation

States the source, the forest rule, the subspace, the motor term, the supports and the cap.

## @evidence contracts/development/design.md#principled-representation

A namespace over the world's joints; impulses in newton seconds and newton metre seconds, velocities in metres and radians per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One entry, called by solveXpbdJoints.motors, returning the joints it leaves to the pair solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Gains, caps and inertias are the motors' and the bodies'; nothing is tuned here.

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.motors

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

Featherstone 2008, chapter 7: factor the inward sweep, propagate the motors' joint impulses, add the supports' impulses (Mirtich 1996), hold capped motors and solve again.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the forest, then per tree: axes, factor, propagate, supports, caps, apply.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A tree without an active motor is skipped; a singular joint or root inertia leaves its tree untouched instead of dividing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each solve is linear in the tree's bodies plus the supports' rows, with one more solve per capped motor; the forest is built in joints times tree depth.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The motors' and every support row's propagation share one factor per solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies' velocities; the forest and its rows are released at return.
