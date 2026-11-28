# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.IMotion

## @evidence contracts/development/common.md#meaningful-documentation

Names the unit quaternion and metre translation applied after rotation.

## @evidence contracts/development/design.md#principled-representation

The two parts represent a rigid motion in one parent coordinate frame. Turn and chain construct the tuple from a pivot or two motions with no scale argument.

## @evidence contracts/development/design.md#minimal-and-owned-surface

All frame placement call sites use the same rotation and translation pair. A frame's optional visual scale remains in its transform.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.IMotion.rotation

## @evidence contracts/development/common.md#meaningful-documentation

Names the unit quaternion that acts on directions and points before translation.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.IMotion.translation

## @evidence contracts/development/common.md#meaningful-documentation

Names the metre shift applied after the rotation.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.UNIT

## @evidence contracts/development/common.md#meaningful-documentation

The components are the unit-scale defaults copied by contact-frame constructors.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.STILL

## @evidence contracts/development/common.md#meaningful-documentation

The record combines identity quaternion and zero metre translation.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.copy

## @evidence contracts/development/common.md#meaningful-documentation

Documents the returned scale, orientation and translation as independent records.

## @evidence contracts/development/implementation.md#principled-implementation

Spreads position, quaternion and scale by their named scalar fields. The copy leaves the supplied frame and its basis unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copies three fixed-size records once. It retains no input or output.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.facing

## @evidence contracts/development/common.md#meaningful-documentation

Documents finite metre origin, projected along direction, the X/Z fallback convention and refusal for unsupported directions.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the supplied normal for positive Y and a projected hint for positive X. Reorders the Engine surface basis to preserve the right-handed contact frame. Engine admission refuses nonfinite and represented parallel inputs. With no hint the 0.9 unit-X convention selects a safely separated direction.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed-size basis and quaternion are constructed. The fallback normal is computed only when the caller omits the direction. The returned transform owns its geometry.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.upright

## @evidence contracts/development/common.md#meaningful-documentation

Documents the unrotated parent axes and unit scale at a point in metres.

## @evidence contracts/development/implementation.md#principled-implementation

Copies the point and supplies identity quaternion and unit scale. The returned axes therefore coincide with the parent basis.

## @evidence contracts/development/implementation.md#efficient-algorithms

Creates three constant-sized output records. It has no retained caller state.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.axis

## @evidence contracts/development/common.md#meaningful-documentation

Names the frame and selected coordinate axis, returning its parent-space unit direction.

## @evidence contracts/development/implementation.md#principled-implementation

Rotates the requested unit coordinate vector by the supplied frame quaternion. Scale and translation belong to the point or visual placement data.

## @evidence contracts/development/implementation.md#efficient-algorithms

Computes one selected direction and one rotation, independent of model size.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.point

## @evidence contracts/development/common.md#meaningful-documentation

Documents the rigid local-to-parent mapping in metres.

## @evidence contracts/development/implementation.md#principled-implementation

Rotates the local point and then adds the frame's translation. The physical metre coordinates use the rigid frame rather than its visual scale.

## @evidence contracts/development/implementation.md#efficient-algorithms

Computes one quaternion action and one vector addition. It returns a new point.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.move

## @evidence contracts/development/common.md#meaningful-documentation

Documents the supplied rigid motion and the copied scale.

## @evidence contracts/development/implementation.md#principled-implementation

Moves the frame's position under rotation and translation and composes its quaternion in the same order. The existing scale remains part of the new frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Transforms only the position and quaternion and copies scale. All output data is call-owned.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.compose

## @evidence contracts/development/common.md#meaningful-documentation

Documents that the parent contributes its rotation and translation and the result carries the child's scale.

## @evidence contracts/development/implementation.md#principled-implementation

Uses a rigid move in which the parent is the outer motion. The child data already describes its position and orientation in that parent.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses one move operation on the supplied child. It has no hierarchy traversal or retained data.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.chain

## @evidence contracts/development/common.md#meaningful-documentation

Documents which motion is applied first and which second.

## @evidence contracts/development/implementation.md#principled-implementation

Multiplies rotations in application order and applies the second rotation to the first translation before adding the second translation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Combines exactly two fixed-size motions into fresh result records.

# src/core/AutoMovieArchetypeFrame.ts#AutoMovieArchetypeFrame.turn

## @evidence contracts/development/common.md#meaningful-documentation

Documents metre pivot point, nonzero direction, degrees and the right-hand rule.

## @evidence contracts/development/implementation.md#principled-implementation

The quaternion rotates about the specified direction. Translation equal to the pivot minus its rotated position leaves the axis fixed when applying the rigid motion.

## @evidence contracts/development/implementation.md#efficient-algorithms

Computes a quaternion and one pivot correction. The result is independent of model or frame count.
