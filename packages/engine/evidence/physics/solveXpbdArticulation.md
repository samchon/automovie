# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.motors

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved, the limit lock, and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

Featherstone 2008, chapter 7: factor the inward sweep, propagate the motors' joint impulses, add the supports' impulses (Mirtich 1996), hold capped motors, lock every axis the solve would carry onto or past a bound over the substep, by Bullet's limit rows (bulletphysics/bullet3, btMultiBodyJointLimitConstraint.cpp lines 104-116 at c517c434e6e017d131ba3ad97ce4ec317226a2b7, zlib: penetrations q - lower and upper - q, active at most zero) read at q + rate h (prescribed joint motion, section 7.3; a limit enforced once reached moving outward, Kokkevis 2004), and solve again.

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

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.responder

## @evidence contracts/development/common.md#meaningful-documentation

States what the response moves, which trees are prepared, how they are factored, and how a correction that reaches a bound holds the axis and is solved again.

## @evidence contracts/development/implementation.md#principled-implementation

Contacts through the articulation (Kokkevis 2004; Featherstone 2008, section 7.5): a unit impulse propagated through the tree's factor at h = 0 gives the row's generalised inverse mass, the displacement of every body and each free axis's rate; an axis the correction would carry onto or past a bound is held as prescribed motion (section 7.3) and the tree factored again, the axes chosen by Bullet's joint-limit rows read at the coordinate the correction reaches; the move itself is taken in joint space, each child placed from its parent by the joint transform at the moved coordinates (Featherstone 2008, chapter 4), so the coordinate reached is the one the bound test read (bulletphysics/bullet3, src/BulletDynamics/Featherstone/btMultiBodyJointLimitConstraint.cpp, lines 104-116 at c517c434e6e017d131ba3ad97ce4ec317226a2b7, zlib, Copyright (c) 2013 Erwin Coumans): the penetrations q - lower and upper - q, a row active when its penetration is at most zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the forest, prepare each tree a contact touches with its free coordinates, then per call propagate each impulse, sum per tree, read the weight; hold reached axes, or apply: the root by its change and every other body placed by its joint's model at the moved coordinates (Featherstone 2008, chapter 4, X_J(q)), parents first.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A body in no prepared tree, or a singular tree, answers none and its caller keeps the rigid body's own correction; no correction is clamped; the bound test is Bullet's, with no threshold of its own; a swing-twist gate has no coordinate per axis, so its axes stay free and the joints' pass restores it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One factor per touched tree per position pass plus one per newly held axis, one linear propagation per impulse; untouched trees are not built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each touched tree's factor serves every contact of the pass until an axis is newly held.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prepared trees live for one position pass and are released with the responder.

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.IPointImpulse

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning, frame and unit.

## @evidence contracts/development/design.md#principled-representation

A unit force direction at a world point of a body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what a propagation needs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.IPointResponse

## @evidence contracts/development/common.md#meaningful-documentation

States the weight, the limit and the apply.

## @evidence contracts/development/design.md#principled-representation

A constraint row's generalised inverse mass, its bound check and its displacement per multiplier.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a positional correction reads and writes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.IResponder

## @evidence contracts/development/common.md#meaningful-documentation

States both members.

## @evidence contracts/development/design.md#principled-representation

Whether a body moves through a prepared tree, and the response of the trees to impulses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two questions the contact pass asks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.directions

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the order of the directions and how the locked ones complete the basis.

## @evidence contracts/development/implementation.md#principled-implementation

The free directions are the joint's motion subspace as the articulated solve uses it, the chart's axes at the configuration (Featherstone 2008, chapter 4, the motion subspace of a joint model); the locked ones complete them to a basis, so the dual basis gives each coordinate's gradient as MuJoCo's per-degree-of-freedom rows have it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the chart's axes, take the free ones in axis order, complete by a normal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chart reading and a few vector products.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of one joint at one configuration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh vectors; retains nothing.

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.coordinate

## @evidence contracts/development/common.md#meaningful-documentation

States which coordinate is read and the gated case.

## @evidence contracts/development/implementation.md#principled-implementation

The coordinate the joint's admission clamps (projectPhysicalJointRotation): the chart's angle, or the twist coordinate 2 atan(q.axis / w); MuJoCo's and Bullet's limit rows compare such a coordinate with its range.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per joint form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A gated joint has no coordinate per axis and answers none.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chart reading at most.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of one joint at one configuration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number; retains nothing.
