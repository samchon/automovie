# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.ITree

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds.

## @evidence contracts/development/design.md#principled-representation

Bodies, edges and the origin in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by solveXpbdArticulation and read by every sweep.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Indices into the states instead of links, so a tree is plain data.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.IState

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds.

## @evidence contracts/development/design.md#principled-representation

The body and its own spatial inertia, kilogram metres squared and kilograms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built once per tree solve; the factor reads its inertia.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The inertia is the body's own at the current pose.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.IEdge

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds.

## @evidence contracts/development/design.md#principled-representation

Parent and child indices with the joint's free axes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built once per tree solve; the sweeps read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One axis record per declared free axis.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.IAxis

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds.

## @evidence contracts/development/design.md#principled-representation

A spatial column, the axis's motor and its present rate in radians per second, and a held impulse in newton metre seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built per tree solve; the factor and the cap check read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The motor is the joint's own; a held motor keeps its cap.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.IFactor

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds.

## @evidence contracts/development/design.md#principled-representation

Per-edge factors and the root's solve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by factor and read by propagate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Holds only what every right-hand side shares.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.IEdgeFactor

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds.

## @evidence contracts/development/design.md#principled-representation

U, D^-1 U^T, D^-1 and the joint terms per axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by factor and read by propagate and the cap check.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The motor terms are the joint's implicit damper.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.Solve

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds.

## @evidence contracts/development/design.md#principled-representation

A function from a right-hand side to its solution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by prepareLinearSystem and kept in a factor.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The factored matrix is fixed for the solve's lifetime.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.IExternal

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds.

## @evidence contracts/development/design.md#principled-representation

A state index and a spatial impulse in newton metre seconds and newton seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Passed to propagate by the contact rows' test impulses.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One body per impulse, so each test is one propagation.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.IJointImpulse

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds.

## @evidence contracts/development/design.md#principled-representation

An edge index, an axis index and an impulse in newton metre seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Passed to propagate for the support rows' joint-impulse responses.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One axis per impulse, so each response is one propagation.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.IResponse

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds.

## @evidence contracts/development/design.md#principled-representation

Per-body spatial velocity changes and per-axis rate changes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by propagate and combined by the solve.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Fresh arrays per propagation.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.factor

## @evidence contracts/development/common.md#meaningful-documentation

States what is factored and the singular case.

## @evidence contracts/development/implementation.md#principled-implementation

Featherstone 2008, chapter 7: U = I^A S, D = S^T U + diag(h c), I^A_parent += I^A - U D^-1 U^T, inward from the leaves; a locked axis is prescribed motion (section 7.3): its U is zero, its row of D the identity, and I^A s is kept as `held` for the propagation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reverse loop over the edges, then the root.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A singular D or root inertia returns null instead of dividing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the tree's bodies with constant 6x6 work per edge.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every propagation of the same substep and held-motor set reuses the factor.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh arrays; retains nothing.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.propagate

## @evidence contracts/development/common.md#meaningful-documentation

States both inputs and what is returned.

## @evidence contracts/development/implementation.md#principled-implementation

Featherstone 2008, chapter 7: p^A = -f_ext, then p^A_parent += p^A + U D^-1 (b - S^T p^A) inward; the root's change -I^A^-1 p^A; then qd = D^-1 (b - S^T p^A) - D^-1 U^T v_parent and v = v_parent + S qd outward. A locked axis moves by its prescribed rate change (section 7.3), whose momentum `held` qd is added to the child's before the free axes and the parent read it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reverse loop, the root, one forward loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A kinematic root does not move.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the tree's bodies with constant 6-vector work per edge.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the factor's U, D^-1 U^T and D^-1.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh arrays; retains nothing.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.spatialInertia

## @evidence contracts/development/common.md#meaningful-documentation

States the matrix, its frame and the kinematic zero.

## @evidence contracts/development/implementation.md#principled-implementation

Featherstone 2008, eq. 2.63, with the world inertia at the current pose and [c]x [c]x^T = |c|^2 E - c c^T.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the nine 3x3 cells filling the four blocks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A kinematic body is all zeros.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: three inertia products.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over its arguments; each tree solve reads it once per body.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array; retains nothing.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.spatialImpulse

## @evidence contracts/development/common.md#meaningful-documentation

States the formula and its order.

## @evidence contracts/development/implementation.md#principled-implementation

A force's moment about the origin is r x f.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cross product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array; retains nothing.

# src/physics/AutoMovieXpbdArticulation.ts#AutoMovieXpbdArticulation.pointChange

## @evidence contracts/development/common.md#meaningful-documentation

States the formula.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid motion's velocity at r is its origin velocity plus w x r.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cross product and one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.
