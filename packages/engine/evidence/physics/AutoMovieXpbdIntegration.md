# src/physics/AutoMovieXpbdIntegration.ts#AutoMovieXpbdIntegration.predict

## @evidence contracts/development/common.md#meaningful-documentation

States the kept pose, both velocity updates and the pose prediction.

## @evidence contracts/development/implementation.md#principled-implementation

Mueller et al. 2020, Algorithm 2, lines 3 to 9: symplectic Euler on velocities, then positions, the quaternion advanced by its derivative and normalized.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keep the pose; a kinematic body is placed and derived; a dynamic body integrates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A massless body takes no force acceleration instead of dividing by zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per body.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each substep starts from the body's new state.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the body; allocates only transient vectors.

# src/physics/AutoMovieXpbdIntegration.ts#AutoMovieXpbdIntegration.derive

## @evidence contracts/development/common.md#meaningful-documentation

States both formulas.

## @evidence contracts/development/implementation.md#principled-implementation

Mueller et al. 2020, Algorithm 2, lines 12 to 15.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One linear and one angular formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The sign of the quaternion difference picks the shorter arc; no other case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per body.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the body's two poses.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the body's velocities.
