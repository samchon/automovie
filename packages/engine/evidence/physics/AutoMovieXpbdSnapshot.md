# src/physics/AutoMovieXpbdSnapshot.ts#AutoMovieXpbdSnapshot.IState

## @evidence contracts/development/common.md#meaningful-documentation

States the settings and the three populations.

## @evidence contracts/development/design.md#principled-representation

JSON-safe numbers and records in creation order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read by this namespace for the world's snapshots.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Settings are one tuple whose order the namespace fixes.

# src/physics/AutoMovieXpbdSnapshot.ts#AutoMovieXpbdSnapshot.IActiveSetState

## @evidence contracts/development/common.md#meaningful-documentation

States the root's handle and both levels' keys.

## @evidence contracts/development/design.md#principled-representation

A handle and two key lists.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read by this namespace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The keys are copied as they are.

# src/physics/AutoMovieXpbdSnapshot.ts#AutoMovieXpbdSnapshot.IBodyState

## @evidence contracts/development/common.md#meaningful-documentation

States the handle, kind, values and set pose.

## @evidence contracts/development/design.md#principled-representation

One flat float64 vector of the body's state in a fixed order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read by this namespace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The flat vector keeps the record small and its order is written and read in one place.

# src/physics/AutoMovieXpbdSnapshot.ts#AutoMovieXpbdSnapshot.IColliderState

## @evidence contracts/development/common.md#meaningful-documentation

States the handle, body, shape and material.

## @evidence contracts/development/design.md#principled-representation

Handles and the interface shape record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read by this namespace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The material is one tuple of the collider's three values.

# src/physics/AutoMovieXpbdSnapshot.ts#AutoMovieXpbdSnapshot.IJointState

## @evidence contracts/development/common.md#meaningful-documentation

States the handle, bodies, joint and motors.

## @evidence contracts/development/design.md#principled-representation

Handles, the profile joint and motor records.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read by this namespace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Motors are entries in axis order as the joint's map holds them.

# src/physics/AutoMovieXpbdSnapshot.ts#AutoMovieXpbdSnapshot.IContactState

## @evidence contracts/development/common.md#meaningful-documentation

States the pair handles and the contact's recorded fields.

## @evidence contracts/development/design.md#principled-representation

Collider handles in place of colliders; every other field as the contact holds it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read by this namespace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contact is copied whole, so a restored world reports the same last step.

# src/physics/AutoMovieXpbdSnapshot.ts#AutoMovieXpbdSnapshot.write

## @evidence contracts/development/common.md#meaningful-documentation

States the order of what is written.

## @evidence contracts/development/implementation.md#principled-implementation

Every field the step reads is copied as its float64 value.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One mapping per population.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is rounded or dropped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in bodies, colliders and joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each snapshot is of a different moment.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records; retains nothing.

# src/physics/AutoMovieXpbdSnapshot.ts#AutoMovieXpbdSnapshot.read

## @evidence contracts/development/common.md#meaningful-documentation

States the handles and order restored.

## @evidence contracts/development/implementation.md#principled-implementation

Every recorded value is assigned back, so the world continues bit for bit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop per population, then the handle counter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Bodies are looked up by recorded handle.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the populations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each restore builds its own objects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fills the given world; retains nothing else.

# src/physics/AutoMovieXpbdSnapshot.ts#AutoMovieXpbdSnapshot.replace

## @evidence contracts/development/common.md#meaningful-documentation

States what the replacer changes and why.

## @evidence contracts/development/implementation.md#principled-implementation

JSON.stringify writes -0 as 0, so a bit-for-bit snapshot marks it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One test of the value.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only an exact negative zero is replaced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per value.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its value.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/physics/AutoMovieXpbdSnapshot.ts#AutoMovieXpbdSnapshot.revive

## @evidence contracts/development/common.md#meaningful-documentation

States what the reviver restores.

## @evidence contracts/development/implementation.md#principled-implementation

The inverse of replace.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One test of the value.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the exact marker is restored.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per value.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its value.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
