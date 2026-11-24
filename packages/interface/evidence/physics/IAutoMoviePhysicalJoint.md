# src/physics/IAutoMoviePhysicalJoint.ts#IAutoMoviePhysicalJoint

## @evidence contracts/development/common.md#meaningful-documentation

A fixed or angularly limited connection between two rigid segments, with an optional clinical swing-twist limit and an optional anatomical gate that bounds the joint in place of its axes.

## @evidence contracts/development/design.md#principled-representation

Parent and child frames describe the same neutral anchor in their respective bone frames; angles are radians in the joint frame. A gated joint (`range`) carries the range-of-motion gate's own records, the bone's constraint and swing-twist frame, with the rotation that carries the joint frame into the bone's, so the solver and the take's range verdict read one set.

## @evidence contracts/development/design.md#minimal-and-owned-surface

validatePhysicalProfile checks anchors and the tree; the engine's solver enforces the axes, the swing-twist limit and the gate (`projectPhysicalJointRotation`), and `measurePhysicalJointLimits` measures the gate; the Human package's canonical profile fills the gate for every bone whose constraint declares `swingTwist`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An empty axes list is fixed; translations and all unlisted angular axes are locked. The swing-twist limit is one record whose ranges are runtime-validated. The gate reuses the interface's constraint and frame records instead of restating their ranges.

# src/physics/IAutoMoviePhysicalJoint.ts#IAutoMoviePhysicalJoint.IGate

## @evidence contracts/development/common.md#meaningful-documentation

States the gate a ball joint is read by and how the joint frame maps onto the bone's frame.

## @evidence contracts/development/design.md#principled-representation

The bone's constraint with its `swingTwist` gate, its swing-twist frame (clinical axes and rest frame) and the joint-to-bone rotation `basis`, the inputs `swingTwistRange` reads a rest-relative rotation with.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its three members are what the projection and the measure read; the ranges stay in the constraint they come from.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The constraint and frame are the interface's own records, not copies of their numbers; no per-joint variant exists.

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
