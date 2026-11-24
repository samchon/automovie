# src/physics/solveXpbdContacts.ts#solveXpbdContacts.IContact

## @evidence contracts/development/common.md#meaningful-documentation

States the pair, its normal, witnesses, materials and multipliers.

## @evidence contracts/development/design.md#principled-representation

Body-frame witnesses in metres, multipliers in newton seconds squared, impulses in newton seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Created by detect and read by the position and velocity passes and the world's manifolds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Witnesses are stored in body frames so the passes read them at the current poses.

# src/physics/solveXpbdContacts.ts#solveXpbdContacts.Filter

## @evidence contracts/development/common.md#meaningful-documentation

States what a false answer excludes.

## @evidence contracts/development/design.md#principled-representation

A predicate over two colliders.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Supplied by the physical simulation's self-exclusions and consulted by detect.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One predicate serves contact response and sensor overlaps.

# src/physics/solveXpbdContacts.ts#solveXpbdContacts.detect

## @evidence contracts/development/common.md#meaningful-documentation

States the bounds test, the filter, the manifold and the sensor case.

## @evidence contracts/development/implementation.md#principled-implementation

Bounding boxes prune pairs; physicalShapePairContact gives depth and normal; physicalShapeContactManifold gives the patch points (Ericson 2005; Gregorius 2015).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pair loop delegating geometry to its owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every pair passing the bounds and the filter is measured exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

Quadratic in colliders for the bounds test, one exact query per overlapping pair.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each step's predicted poses differ, so nothing carries over.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh contacts; retains nothing.

# src/physics/solveXpbdContacts.ts#solveXpbdContacts.positions

## @evidence contracts/development/common.md#meaningful-documentation

States the compliant depth correction and the friction projection.

## @evidence contracts/development/implementation.md#principled-implementation

Macklin et al. 2016 compliance alpha = w / omega^2 on depth beyond the allowed error; static friction as a Coulomb projection of the accumulated tangential multiplier onto mu lambda_n. A jointed body's row reads its whole tree (Kokkevis 2004; Featherstone 2008, section 7.5, `solveXpbdArticulation.responder`): w is the tree's generalised inverse mass at the point and the correction moves every body of the tree along its joints' free axes. A correction that would carry a joint axis onto or past a bound holds that axis and is solved again (solveXpbdArticulation.IPointResponse.limit), at most once more per newly held axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the contacts: normal, then tangential, each through the pair's row (`pair`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sensors are skipped; coefficients are the contact's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in contacts per pass.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Multipliers accumulate on the contacts for the step only.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies it is given; allocates only transient vectors.

# src/physics/solveXpbdContacts.ts#solveXpbdContacts.velocities

## @evidence contracts/development/common.md#meaningful-documentation

States dynamic friction's budget and the restitution rule.

## @evidence contracts/development/implementation.md#principled-implementation

Mueller et al. 2020, sec. 3.6: dynamic friction bounded by the cone's remaining impulse, then the normal velocity set to the restitution of the pre-step approach above 2 g h.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Friction then normal, each with its own generalized inverse mass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only pressing contacts are treated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in contacts per sweep.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The friction budget accumulates on the contacts for the step only.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies it is given; allocates only transient vectors.

# src/physics/solveXpbdContacts.ts#solveXpbdContacts.manifolds

## @evidence contracts/development/common.md#meaningful-documentation

States the grouping, its order and the sensor exclusion.

## @evidence contracts/development/implementation.md#principled-implementation

detect emits a pair's points together, so consecutive equal pair indices form its patch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop that opens a group whenever the pair changes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sensors are skipped; no pair has its own rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each pass groups the step's current contacts; nothing is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh arrays over the given records; retains nothing.
