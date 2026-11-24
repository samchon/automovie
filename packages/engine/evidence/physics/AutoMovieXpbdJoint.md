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

States the speed, the damping, the cap of each direction and the posture's own speed.

## @evidence contracts/development/design.md#principled-representation

Radians per second, newton metre seconds per radian and newton metres. The reverse cap defaults to the forward one and the posture speed to the speed, so a symmetric or plain motor carries neither.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Set by the joint motor configuration and read by the solver's motors and the support cascade's posture rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One record per free axis.

# src/physics/AutoMovieXpbdJoint.ts#AutoMovieXpbdJoint.cap

## @evidence contracts/development/common.md#meaningful-documentation

States which direction's cap applies and the units.

## @evidence contracts/development/implementation.md#principled-implementation

A torque bound per direction (Herzog et al. 2016, Section 2.1), times the substep.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The absent reverse cap is the forward one, the motor's declared meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains and allocates nothing.
