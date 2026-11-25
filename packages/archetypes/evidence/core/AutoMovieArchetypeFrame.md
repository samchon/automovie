# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.IMotion

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

A rigid motion of the model's space: a unit quaternion applied about the origin, then a translation in metres. It has no scale, so a motion cannot deform a part.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; made by `turn` and `AutoMovieArchetypeArticulation.motion`, composed by `chain` and applied by `move`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Not the interface transform, whose scale a rigid motion must not carry.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.copy

## @evidence contracts/development/common.md#meaningful-documentation

Defines the geometric records copied without rotation normalization.

## @evidence contracts/development/implementation.md#principled-implementation

Copy the three scalar records at their existing precision and value semantics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three independent records form one immutable-by-owner value.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No alias, normalization or scalar conversion changes the current result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-sized copy with no input-size work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Centralizes the rigid placement copy used at public sample handoff.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the result immediately.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.facing

## @evidence contracts/development/common.md#meaningful-documentation

States each direction's role, that lengths are free and how a missing line is chosen.

## @evidence contracts/development/implementation.md#principled-implementation

Gram-Schmidt on the two directions, `+Z` as their cross product, then the engine's basis-to-quaternion conversion; the two inputs must not be parallel, which the producers' fixed directions never are.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One orthonormal basis, one conversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The fallback line depends only on `out`, so it is the same for every archetype.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `quaternionFromAutoMovieBasis`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.upright

## @evidence contracts/development/common.md#meaningful-documentation

States the result's axes.

## @evidence contracts/development/implementation.md#principled-implementation

The identity rotation at a point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.axis

## @evidence contracts/development/common.md#meaningful-documentation

States the space of the result.

## @evidence contracts/development/implementation.md#principled-implementation

The frame's rotation applied to the unit axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `Quaternion.rotateVector`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.point

## @evidence contracts/development/common.md#meaningful-documentation

States both spaces.

## @evidence contracts/development/implementation.md#principled-implementation

Rotate, then translate; scale is one by this namespace's premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation and one sum.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's vector arithmetic.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.move

## @evidence contracts/development/common.md#meaningful-documentation

States what moves and what is kept.

## @evidence contracts/development/implementation.md#principled-implementation

The origin goes through the motion's map and the rotation is premultiplied by its turn, then renormalised so repeated motions keep a unit quaternion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map of the origin, one product.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's quaternion arithmetic.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.compose

## @evidence contracts/development/common.md#meaningful-documentation

States the spaces and the use.

## @evidence contracts/development/implementation.md#principled-implementation

A unit-scale parent frame read as a rigid motion and applied through `move`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The parent's scale is not applied, by this namespace's unit-scale premise; a scaled placement is the scene's to lower.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `move`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.chain

## @evidence contracts/development/common.md#meaningful-documentation

States the order.

## @evidence contracts/development/implementation.md#principled-implementation `after(before(p)) = Ra Rb p + Ra tb + ta`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One product and one mapped translation.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's quaternion arithmetic.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.turn

## @evidence contracts/development/common.md#meaningful-documentation

States the turning sense and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

A rotation about a line through `c` is `p -> R (p - c) + c`, so its translation is `c - R c`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One axis-angle quaternion and the translation it implies.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `Quaternion.fromAxisAngle`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
