# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.motors

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved, the limit lock, and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

Featherstone 2008, chapter 7: factor the inward sweep, propagate the motors' joint impulses, add the supports' impulses (Mirtich 1996), hold capped motors, lock every axis the solve would carry past its limit by more than the joints' tolerance ROM_TOLERANCE (prescribed joint motion, section 7.3; a limit enforced once reached moving outward, Kokkevis 2004) and solve again.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the forest, then per tree: axes, factor, propagate, supports, then the caps and the locks, apply.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A tree without an active motor is skipped; a singular joint or root inertia leaves its tree untouched instead of dividing; a lock holds the axis's rate at zero, nothing is clamped after the solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each solve is linear in the tree's bodies plus the supports' rows, with one more solve per newly capped motor or newly locked axis; the forest is built in joints times tree depth.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The motors' and every support row's propagation share one factor per solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies' velocities; the forest, the trees and their rows are released at return.

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

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.IForest

## @evidence contracts/development/common.md#meaningful-documentation

States what it holds.

## @evidence contracts/development/design.md#principled-representation

The forest's nodes and the joints outside it, the two things every articulation pass reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the nodes and the loops.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: it is built from the joints and the bodies' `dynamic` by each pass that reads it.

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.forest

## @evidence contracts/development/common.md#meaningful-documentation

States the edge rule and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

A joint becomes a tree edge when its child is dynamic, has no parent edge yet and lies in another tree, the spanning-forest rule of the articulated-body algorithm (Featherstone 2008, chapter 7); the rest close loops and are solved pair by pair.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the joints in creation order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Joints times tree depth, once per pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One forest per pass, shared by every tree of that pass.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh forest; retains nothing itself.

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.INode

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

One body of the forest with its edge, parent and children.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the tree walks read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
