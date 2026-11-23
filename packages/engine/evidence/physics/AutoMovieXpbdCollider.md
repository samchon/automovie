# src/physics/AutoMovieXpbdCollider.ts#AutoMovieXpbdCollider

## @evidence contracts/development/common.md#meaningful-documentation

States the frame of the shape, the material, the sensor case and the combine rule.

## @evidence contracts/development/design.md#principled-representation

The profile's own shape record in the body frame, a dimensionless friction and restitution, and a sensor flag.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members the world's contact solve and the simulation's contact readers use.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's shape type instead of a solver-specific shape.

# src/physics/AutoMovieXpbdCollider.ts#AutoMovieXpbdCollider.prototype.parent

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned and that it is the shared record.

## @evidence contracts/development/implementation.md#principled-implementation

A collider rides one body for its lifetime, fixed at creation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A read of fixed state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the world-owned body; retains nothing new.

# src/physics/AutoMovieXpbdCollider.ts#AutoMovieXpbdCollider.prototype.bodyPose

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and that the pose is fresh.

## @evidence contracts/development/implementation.md#principled-implementation

The body's frame origin and rotation, which the shape transform is expressed in.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to the body's translation and rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A read of the current pose; the next correction changes it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh pose; retains nothing.

# src/physics/AutoMovieXpbdCollider.ts#AutoMovieXpbdCollider.prototype.bounds

## @evidence contracts/development/common.md#meaningful-documentation

States the local box of each shape kind, the world transform of its half-extents and the enclosure guarantee.

## @evidence contracts/development/implementation.md#principled-implementation

The world extent of a rotated box along each world axis is the sum of its half-extents times the absolute rotation matrix entries (Ericson 2005, Real-Time Collision Detection, sec. 4.2.6), so the result encloses the local box and with it the shape.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The local box is built once at construction; this method only places it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No padding or margin; the box is the shape's own extremes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call: three axis rotations and nine products, independent of a hull's point count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the local box computed at construction, valid because the shape is readonly.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh bounds; retains nothing.

# src/physics/AutoMovieXpbdCollider.ts#AutoMovieXpbdCollider.prototype.translation

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and composition.

## @evidence contracts/development/implementation.md#principled-implementation

Composes the body pose with the shape's body-frame transform.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression over the body's translation and orientation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A read of the current pose; the next correction changes it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.

# src/physics/AutoMovieXpbdCollider.ts#AutoMovieXpbdCollider.prototype.rotation

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and composition.

## @evidence contracts/development/implementation.md#principled-implementation

Composes the body rotation with the shape's body-frame rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quaternion product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A read of the current pose; the next correction changes it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh quaternion; retains nothing.

# src/physics/AutoMovieXpbdCollider.ts#AutoMovieXpbdCollider.IBox

## @evidence contracts/development/common.md#meaningful-documentation

States the centre and half-extents.

## @evidence contracts/development/design.md#principled-representation

Shape-frame metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built once per collider and read by its bounds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Computed from the shape itself; no padding.
