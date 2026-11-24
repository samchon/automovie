# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.motors

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved, what it reads (the world's kept forest) and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

Featherstone 2008, chapter 7: factor the inward sweep, propagate the motors' joint impulses, add the supports' impulses (Mirtich 1996), hold capped motors, lock every axis the solve would carry past its limit (prescribed joint motion, section 7.3) and solve again.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Per tree of the kept forest: axes, factor, propagate, supports, then the caps and the locks, apply.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A tree without an active motor is skipped; a singular joint or root inertia leaves its tree untouched instead of dividing; a lock holds the axis's rate at zero, nothing is clamped after the solve.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each solve is linear in the tree's bodies plus the supports' rows, with one more solve per newly capped motor or newly locked axis; the forest is the world's, built once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The motors' and every support row's propagation share one factor per solve; the forest is kept by the world across steps.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies' velocities; the trees and their rows are released at return.

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.impulse

## @evidence contracts/development/common.md#meaningful-documentation

States what the blow changes, through which joints, and the singular case that throws.

## @evidence contracts/development/implementation.md#principled-implementation

The impulse form of the articulated-body algorithm (Featherstone 2008, section 7.5; Mirtich 1996, chapter 4): one spatial impulse at the struck body, propagated through the tree's factor with no motor damping (an instant has none), gives every body the velocity change that keeps each attachment closed and moves each joint only along its free axes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Take the struck body's tree from the world's forest, factor it, propagate the one impulse and add the changes (`apply`, shared with the motors' pass).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A kinematic struck body is left unchanged; a singular tree inertia throws instead of dividing or falling back to a rigid-body impulse.

## @evidence contracts/development/implementation.md#efficient-algorithms

One factor and one propagation, linear in the struck tree's bodies; the forest is the world's.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A blow lands once on its first substep; nothing it computes is asked again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the struck tree's velocities; the tree and its factor are released at return.

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.IForest

## @evidence contracts/development/common.md#meaningful-documentation

States what it holds and when the world rebuilds it.

## @evidence contracts/development/design.md#principled-representation

The forest's nodes and the joints outside it, the two things every articulation pass reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the nodes and the loops.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: it depends only on the joints and the bodies' `dynamic`, and is rebuilt when either changes.

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

Joints times tree depth, once per world change.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Built once and kept by the world (`AutoMovieXpbdWorld.forest`).

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

States what the response moves, how the trees are factored and when an axis counts as on its limit, with the derivation of the probe's midpoint.

## @evidence contracts/development/implementation.md#principled-implementation

Contacts through the articulation (Kokkevis 2004; Featherstone 2008, section 7.5): a unit impulse propagated through the tree's factor at `h = 0` gives the row's generalised inverse mass and the displacement of every body, with the axes on their limits held as prescribed motion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare each tree on first use, propagate each impulse, sum per tree, read the weight, apply.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A body in no tree, or a singular tree, answers none and its caller keeps the rigid body's own correction; no correction is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One factor per tree per position pass, one linear propagation per impulse.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each tree's factor is shared by every contact of the pass.

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

States the weight and the apply.

## @evidence contracts/development/design.md#principled-representation

A constraint row's generalised inverse mass and its displacement per multiplier.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a positional correction reads and writes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/solveXpbdArticulation.ts#solveXpbdArticulation.IResponder

## @evidence contracts/development/common.md#meaningful-documentation

States both members.

## @evidence contracts/development/design.md#principled-representation

Whether a body moves through a tree, and the response of the trees to impulses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two questions the contact pass asks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
