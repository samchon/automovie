# src/physics/respondXpbdArticulation.ts#respondXpbdArticulation

## @evidence contracts/development/common.md#meaningful-documentation

States what the response moves, which trees are prepared, how they are factored, and how a correction that reaches a bound holds the axis and is solved again.

## @evidence contracts/development/implementation.md#principled-implementation

Contacts through the articulation (Kokkevis 2004; Featherstone 2008, section 7.5): a unit impulse propagated through the tree's factor at h = 0 gives the row's generalised inverse mass, the displacement of every body and each free axis's rate; an axis the correction would carry onto or past a bound is held as prescribed motion (section 7.3) and the tree factored again, the axes chosen by Bullet's joint-limit rows read at the coordinate the correction reaches (reachesXpbdJointBound); the move is taken in joint space, each child placed from its parent by the joint transform at the moved coordinates (Featherstone 2008, chapter 4).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare each touched tree with its state index and free coordinates; per call propagate each impulse, sum per tree, read the weight; hold reached axes, or move the root by its change and place every other body by its joint's model, parents first.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A body in no prepared tree, or a singular tree, answers none and its caller keeps the rigid body's own correction; no correction is clamped; the bound test is Bullet's, with no threshold of its own; a swing-twist gate has no coordinate per axis, so its axes stay free and the joints' pass restores it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One factor per touched tree per position pass plus one per newly held axis, one linear propagation per impulse; each body's tree and state index are read from maps built at preparation; untouched trees are not built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each touched tree's factor serves every contact of the pass until an axis is newly held.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prepared trees live for one position pass and are released with the responder.
