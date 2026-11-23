# src/physics/AutoMovieXpbdMath.ts#AutoMovieXpbdMath.weight

## @evidence contracts/development/common.md#meaningful-documentation

States both generalized inverse masses and the fixed-world case.

## @evidence contracts/development/implementation.md#principled-implementation

Mueller et al. 2020, eq. 2 and 3: 1/m + (r x n)^T I^-1 (r x n) for a positional row, n^T I^-1 n for an angular one; a kinematic body or the world contributes zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per correction kind over the body's inverse mass and inertia.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamping; a non-dynamic body returns exactly zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over its arguments; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number; retains nothing.

# src/physics/AutoMovieXpbdMath.ts#AutoMovieXpbdMath.positional

## @evidence contracts/development/common.md#meaningful-documentation

States the compliant multiplier update and which body moves which way.

## @evidence contracts/development/implementation.md#principled-implementation

Mueller et al. 2020, sec. 3.3.1 with Macklin et al. 2016: dlambda = (c - alpha/h^2 lambda) / (wA + wB + alpha/h^2).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One multiplier update and one shared application.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A zero total weight returns zero instead of dividing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over its arguments; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies it is given; allocates only transient vectors.

# src/physics/AutoMovieXpbdMath.ts#AutoMovieXpbdMath.apply

## @evidence contracts/development/common.md#meaningful-documentation

States the opposite moves of the two bodies.

## @evidence contracts/development/implementation.md#principled-implementation

Newton's third law on a positional impulse: +p on the first body and -p on the second, each through its inverse mass and inertia.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates both moves to one local helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A null second body is the fixed world.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over its arguments; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies it is given; allocates only transient vectors.

# src/physics/AutoMovieXpbdMath.ts#AutoMovieXpbdMath.impulse

## @evidence contracts/development/common.md#meaningful-documentation

States the opposite velocity changes of the two bodies.

## @evidence contracts/development/implementation.md#principled-implementation

Mueller et al. 2020, sec. 3.6: a velocity impulse changes each body's linear and angular velocity through its inverse mass and inertia, oppositely.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates both changes to one local helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A null second body is the fixed world.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over its arguments; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies it is given; allocates only transient vectors.

# src/physics/AutoMovieXpbdMath.ts#AutoMovieXpbdMath.spin

## @evidence contracts/development/common.md#meaningful-documentation

States the opposite angular velocity changes.

## @evidence contracts/development/implementation.md#principled-implementation

An angular impulse changes angular velocity by I^-1 p on the first body and -I^-1 p on the second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the two bodies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Kinematic bodies and the world are skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over its arguments; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies it is given; allocates only transient vectors.

# src/physics/AutoMovieXpbdMath.ts#AutoMovieXpbdMath.point

## @evidence contracts/development/common.md#meaningful-documentation

States the block point correction and its matrix.

## @evidence contracts/development/implementation.md#principled-implementation

The three rows of a ball attachment solved together: K = sum (1/m) E - [r]x I^-1 [r]x, p = K^-1 d, the standard point-constraint effective mass.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Assemble K, solve 3x3, apply.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A singular K applies nothing instead of dividing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: three inertia products per body and one 3x3 solve.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over its arguments; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies it is given; allocates only transient vectors.

# src/physics/AutoMovieXpbdMath.ts#AutoMovieXpbdMath.rotation

## @evidence contracts/development/common.md#meaningful-documentation

States the block rotation correction.

## @evidence contracts/development/implementation.md#principled-implementation

p = (I_A^-1 + I_B^-1)^-1 theta removes the whole linearized rotation in one correction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Assemble K, solve 3x3, turn both bodies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A singular K applies nothing instead of dividing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure computation over its arguments; nothing is shared between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies it is given; allocates only transient vectors.
