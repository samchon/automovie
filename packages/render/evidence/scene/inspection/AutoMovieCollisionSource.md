# src/scene/inspection/AutoMovieCollisionSource.ts#AutoMovieCollisionSource.IInstances

## @evidence contracts/development/design.md#principled-representation

The array index is the instance index, and its value is the generator's stable slot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries only the identity the collision report names.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The group is the generator's explicit formation owner.

## @evidence contracts/development/common.md#meaningful-documentation

Describes each field's origin.

# src/scene/inspection/AutoMovieCollisionSource.ts#AutoMovieCollisionSource.ICord

## @evidence contracts/development/design.md#principled-representation

Flat object-local metre coordinates of consecutive distinct particles and the tube radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The soft-prop owner writes it with the same frame that rebuilt the tube.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Fewer than two distinct particles draw no tube and record nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the coordinate frame and units.

# src/scene/inspection/AutoMovieCollisionSource.ts#AutoMovieCollisionSource.bindInstances

## @evidence contracts/development/common.md#meaningful-documentation

States what is recorded, on which object and from which owner.

## @evidence contracts/development/implementation.md#principled-implementation

The record lives on the batch the generator draws, so the collector reads the identities of exactly the drawn instances.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One tagged assignment under the module's key.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The slots are stored as given; no slot is derived from names or nesting.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A constant-time assignment chooses no algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each generator update writes its current record once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The record lives on the mesh and is released with it.

# src/scene/inspection/AutoMovieCollisionSource.ts#AutoMovieCollisionSource.bindCord

## @evidence contracts/development/common.md#meaningful-documentation

States what is recorded or cleared and on which object.

## @evidence contracts/development/implementation.md#principled-implementation

The record sits on the tube rebuilt from the same particles, and a null source removes a stale record so a surface that stopped being a cord is read as geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delete or one tagged assignment under the module's key.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The particles are stored as given; no cord is inferred from the tube's shape.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A constant-time assignment chooses no algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each soft-prop update writes its current record once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The record lives on the object and is released or deleted with it.

# src/scene/inspection/AutoMovieCollisionSource.ts#AutoMovieCollisionSource.bindAssembly

## @evidence contracts/development/common.md#meaningful-documentation

States what is recorded and relative to what.

## @evidence contracts/development/implementation.md#principled-implementation

Each part's placement is stored relative to the root's world matrix at build time, so a later reader can tell whether the part still holds it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One world-matrix update, one inverse and one relative matrix per part.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The parts are the ones the builder passes; nesting adds none.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the parts, with one matrix product each.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A model is recorded once when it is built.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The placements are kept in a WeakMap keyed by the root, so they are released with the model.

# src/scene/inspection/AutoMovieCollisionSource.ts#AutoMovieCollisionSource.assembly

## @evidence contracts/development/common.md#meaningful-documentation

States the premise on the world matrices and both outcomes.

## @evidence contracts/development/implementation.md#principled-implementation

Compares every part's current root-relative matrix with its built one, so only a model still rigid in its built shape groups its parts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup, one inverse and one element-wise comparison per part.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Any element beyond 2^-20 relative difference voids the assembly instead of being tolerated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the parts, with one matrix product and sixteen comparisons each, stopping at the first moved part.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Placement can change every frame, so each observation compares afresh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh set and keeps nothing.

# src/scene/inspection/AutoMovieCollisionSource.ts#AutoMovieCollisionSource.instances

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and when nothing is.

## @evidence contracts/development/implementation.md#principled-implementation

Returns only a record this module tagged as instances, so foreign userData is never read as identities.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read and one tag check.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An untagged or differently tagged record yields undefined instead of a guessed slot list.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A constant-time read chooses no algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The stored record itself is returned.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the mesh's record and keeps nothing.

# src/scene/inspection/AutoMovieCollisionSource.ts#AutoMovieCollisionSource.cord

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and when nothing is.

## @evidence contracts/development/implementation.md#principled-implementation

Returns only a record this module tagged as a cord, so a surface is read as a cord only when its owner said so.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read and one tag check.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An untagged or differently tagged record yields undefined instead of a guessed cord.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A constant-time read chooses no algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The stored record itself is returned.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the object's record and keeps nothing.
