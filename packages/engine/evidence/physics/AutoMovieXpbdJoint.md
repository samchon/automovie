# src/physics/AutoMovieXpbdJoint.ts#AutoMovieXpbdJoint

## @evidence contracts/development/common.md#meaningful-documentation

States the attachment, the two limit forms and the motor law.

## @evidence contracts/development/design.md#principled-representation

The profile's own joint record carries the frames, axes and limits; motors hold a speed in radians per second, a damping in newton metre seconds per radian and a cap in newton metres per free axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members the world's joint solve and the simulation's motor configuration use.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's joint record instead of a solver-specific copy.

# src/physics/AutoMovieXpbdJoint.ts#AutoMovieXpbdJoint.prototype.parentFrame

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and that the record is shared.

## @evidence contracts/development/implementation.md#principled-implementation

The anchor frame is fixed by the profile joint for the joint's lifetime.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A read of fixed state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the joint's record; retains nothing new.

# src/physics/AutoMovieXpbdJoint.ts#AutoMovieXpbdJoint.prototype.childFrame

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and that the record is shared.

## @evidence contracts/development/implementation.md#principled-implementation

The anchor frame is fixed by the profile joint for the joint's lifetime.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A read of fixed state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the joint's record; retains nothing new.

# src/physics/AutoMovieXpbdJoint.ts#AutoMovieXpbdJoint.IMotor

## @evidence contracts/development/common.md#meaningful-documentation

States the speed, damping and cap.

## @evidence contracts/development/design.md#principled-representation

Radians per second, newton metre seconds per radian and newton metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Set by the joint motor configuration and read by the solver's motors.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One record per free axis.
