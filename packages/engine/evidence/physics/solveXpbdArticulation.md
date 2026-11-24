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

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.impulse

## @evidence contracts/development/common.md#meaningful-documentation

States what the blow changes, through which joints, and the singular case that throws.

## @evidence contracts/development/implementation.md#principled-implementation

The impulse form of the articulated-body algorithm (Featherstone 2008, section 7.5; Mirtich 1996, chapter 4): one spatial impulse at the struck body, propagated through the tree's factor with no motor damping (an instant has none), gives every body the velocity change that keeps each attachment closed and moves each joint only along its free axes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the forest the motors' pass builds (`forest`), take the struck body's tree, factor it, propagate the one impulse and add the changes (`apply`, shared with the motors' pass).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A kinematic struck body is left unchanged; a singular tree inertia throws instead of dividing or falling back to a rigid-body impulse.

## @evidence contracts/development/implementation.md#efficient-algorithms

One factor and one propagation, linear in the struck tree's bodies; the forest is built in joints times tree depth, once per blow.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A blow lands once on its first substep; nothing it computes is asked again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the struck tree's velocities; the forest, the tree and its factor are released at return.
