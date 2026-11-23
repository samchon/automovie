# src/physics/IAutoMoviePhysicalJoint.ts#IAutoMoviePhysicalJoint

## @evidence contracts/development/common.md#meaningful-documentation

A fixed or angularly limited connection between two rigid segments, with an optional clinical swing-twist limit.

## @evidence contracts/development/design.md#principled-representation

Parent and child frames describe the same neutral anchor in their respective bone frames; angles are radians in the joint frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

validatePhysicalProfile checks anchors and the tree; the engine's solver enforces the axes and the swing-twist limit; the motions human model fills the swing-twist limit from the rig's clinical ranges.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An empty axes list is fixed; translations and all unlisted angular axes are locked. The swing-twist limit is one record whose ranges are runtime-validated.

# src/physics/IAutoMoviePhysicalJoint.ts#IAutoMoviePhysicalJoint.ISwingTwist

## @evidence contracts/development/common.md#meaningful-documentation

States the decomposition and the cone.

## @evidence contracts/development/design.md#principled-representation

Unit joint-frame axes and radian ranges; a range minimum is at most zero and its maximum at least zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The engine's swing-twist limit reads every member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Asymmetric ranges per swing axis describe the quadrant ellipses directly instead of a separate shape per quadrant.

# src/physics/IAutoMoviePhysicalJoint.ts#IAutoMoviePhysicalJoint.IRange

## @evidence contracts/development/common.md#meaningful-documentation

An angle range in radians.

## @evidence contracts/development/design.md#principled-representation

Radians; minimum at most maximum.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The swing-twist limit's three ranges.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Order is validated at runtime.
