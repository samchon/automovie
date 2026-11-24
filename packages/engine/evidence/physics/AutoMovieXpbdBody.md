# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody

## @evidence contracts/development/common.md#meaningful-documentation

States the frames, units, kinematic case, force accumulation and ownership.

## @evidence contracts/development/design.md#principled-representation

World metres and unit quaternions for poses, metres and radians per second for velocities, inverse kilograms and inverse kilogram square metres for mass properties; a kinematic body is the one whose inverse mass the corrections read as zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members the physical simulation's trackers, contacts, balance and ownership read and write: pose, velocities, point velocity, mass properties, accumulated wrench, body kind and the next kinematic pose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One class for dynamic and kinematic bodies, told apart by their kind, as the solver's formulas treat them.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.translation

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and formula of the returned origin.

## @evidence contracts/development/implementation.md#principled-implementation

The solver moves the centre of mass, so the frame origin follows from it and the rotated body-frame centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression over the body's own pose and mass properties.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case; a body without mass properties has a zero body-frame centre and returns its centre.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one quaternion rotation and one subtraction.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read of the current pose; the next correction changes it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.rotation

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and that the result is a fresh copy.

## @evidence contracts/development/implementation.md#principled-implementation

Copies the stored orientation, which the constructor and every placement normalise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work, one fresh record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A copy of current state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh quaternion so a caller cannot mutate the body; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.worldCom

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and that the result is a fresh copy.

## @evidence contracts/development/implementation.md#principled-implementation

Copies the centre the solver integrates and corrects.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work, one fresh record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A copy of current state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.place

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, units, the normalisation and what the placement keeps.

## @evidence contracts/development/implementation.md#principled-implementation

The inverse of translation: the centre is the origin plus the rotated body-frame centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sets orientation and centre only; callers that start a new step's history (setMass, setTranslation, setRotation) reset the previous pose themselves.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case for kinematic bodies; the world's integrate uses the same placement for a set kinematic pose.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one normalisation, one rotation, one addition.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Stores fresh pose records on the body; retains no caller object.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.setMass

## @evidence contracts/development/common.md#meaningful-documentation

States the units and frames of each property, the kept pose and the previous-centre reset.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the frame origin before the change and re-places the frame there, so only the centre of mass moves.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copies the properties, then reuses translation and place.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case; values are stored as given and admission belongs to the binding.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Stores copies of the given vectors; retains no caller object.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.mass

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and the default.

## @evidence contracts/development/implementation.md#principled-implementation

Returns the stored mass; the inverse mass, not this value, tells a kinematic body apart.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A read of current state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.inverseMass

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and both zero cases.

## @evidence contracts/development/implementation.md#principled-implementation

Mueller et al. 2020 give an immovable body zero inverse mass, so the generalized inverse masses leave it unmoved.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The zero for non-positive mass guards the division for a body whose mass is not yet set, which then takes no correction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One division; nothing worth sharing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.inverseInertia

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, its frames, the kinematic zero and the zero-moment axis.

## @evidence contracts/development/implementation.md#principled-implementation

The inertia tensor is diagonal in its principal frame, so its inverse divides the vector's principal coordinates by the moments, rotated back to the world.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Rotate in, divide per axis, rotate out.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A zero moment yields zero on that axis instead of an infinity, so a body without mass properties takes no angular correction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one quaternion product and two rotations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

freezeInverseInertia evaluates this map once a substep and keeps it as a matrix for that substep's corrections.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.freezeInverseInertia

## @evidence contracts/development/common.md#meaningful-documentation

States when the world calls it, why the inertia is held fixed and the matrix layout.

## @evidence contracts/development/implementation.md#principled-implementation

A linear map is its images of the basis vectors, so three applications of inverseInertia give the exact world matrix at the predicted orientation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds the matrix from inverseInertia, so the frozen and live maps share one formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case; a kinematic body's columns are zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: three map applications once a substep.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the matrix across the substep's corrections; the next call at the next substep's predicted pose replaces it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one nine-number array per body, replaced at each call.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.frozenInverseInertia

## @evidence contracts/development/common.md#meaningful-documentation

States the matrix it reads, the frame and the kinematic zero.

## @evidence contracts/development/implementation.md#principled-implementation

A row-major matrix-vector product with the frozen map.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One product; the matrix belongs to freezeInverseInertia.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The kinematic zero matches inverseInertia; non-null assertions read the fixed nine entries.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: nine products.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the substep's frozen matrix instead of rotating per call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.worldInertia

## @evidence contracts/development/common.md#meaningful-documentation

States the formula and its frames.

## @evidence contracts/development/implementation.md#principled-implementation

The inertia tensor is diagonal in its principal frame; the world integration reads it for the gyroscopic term `w x I w`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Rotate in, scale per axis, rotate out.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: one quaternion product and two rotations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per body and substep; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.linvel

## @evidence contracts/development/common.md#meaningful-documentation

States the point, frame and unit.

## @evidence contracts/development/implementation.md#principled-implementation

Copies the velocity the step derives from the pose change and the velocity passes adjust.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work, one fresh record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A copy of current state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.angvel

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and unit.

## @evidence contracts/development/implementation.md#principled-implementation

Copies the angular velocity the step derives from the rotation change.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work, one fresh record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A copy of current state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.setLinvel

## @evidence contracts/development/common.md#meaningful-documentation

States the point, frame, unit and when the value takes effect.

## @evidence contracts/development/implementation.md#principled-implementation

Stores a copy that the next integration reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field write.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case; a kinematic body's velocity is re-derived from its set pose at the next step.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Stores a copy; retains no caller object.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.setAngvel

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and when the value takes effect.

## @evidence contracts/development/implementation.md#principled-implementation

Stores a copy that the next integration reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field write.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case; a kinematic body's velocity is re-derived from its set pose at the next step.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Stores a copy; retains no caller object.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.velocityAtPoint

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, frame and units.

## @evidence contracts/development/implementation.md#principled-implementation

The rigid-body velocity field: the centre's velocity plus the angular velocity crossed with the offset from the centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression over the body's state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case; any point is treated as rigidly attached.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read per point; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.applyImpulseAtPoint

## @evidence contracts/development/common.md#meaningful-documentation

States the linear and angular updates, units, frames and the kinematic case.

## @evidence contracts/development/implementation.md#principled-implementation

Newton-Euler impulse response: the impulse changes linear momentum and its moment about the centre changes angular momentum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two updates through inverseMass and inverseInertia.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The kinematic return matches its zero inverse mass and inertia.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Stores fresh velocity records; retains no caller object.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.addForce

## @evidence contracts/development/common.md#meaningful-documentation

States the point, frame, unit and the accumulation's lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Forces on one rigid body at its centre sum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One addition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case; the world's integration ignores the wrench of a kinematic body.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one summed vector; retains no caller object.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.addTorque

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and the accumulation's lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Torques on one rigid body sum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One addition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case; the world's integration ignores the wrench of a kinematic body.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one summed vector; retains no caller object.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.addForceAtPoint

## @evidence contracts/development/common.md#meaningful-documentation

States the decomposition, frames and units.

## @evidence contracts/development/implementation.md#principled-implementation

A force off the centre is equivalent to the same force at the centre plus the torque `(p - c) x f`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to addForce and addTorque.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds only the summed wrench; retains no caller object.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.resetForces

## @evidence contracts/development/common.md#meaningful-documentation

States the effect.

## @evidence contracts/development/implementation.md#principled-implementation

Ends the accumulation the owner started with addForce.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field write.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Releases the accumulated force.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.resetTorques

## @evidence contracts/development/common.md#meaningful-documentation

States the effect.

## @evidence contracts/development/implementation.md#principled-implementation

Ends the accumulation the owner started with addTorque.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field write.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Releases the accumulated torque.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.userForce

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and that the result is a fresh copy.

## @evidence contracts/development/implementation.md#principled-implementation

Copies the sum addForce and addForceAtPoint accumulated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work, one fresh record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A copy of current state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.userTorque

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and that the result is a fresh copy.

## @evidence contracts/development/implementation.md#principled-implementation

Copies the sum addTorque and addForceAtPoint accumulated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work, one fresh record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A copy of current state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.isDynamic

## @evidence contracts/development/common.md#meaningful-documentation

States what the flag means.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the body's kind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A read of current state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.isKinematic

## @evidence contracts/development/common.md#meaningful-documentation

States what the flag means.

## @evidence contracts/development/implementation.md#principled-implementation

The negation of the body's kind: a body is either dynamic or kinematic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One field read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A read of current state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.setDynamic

## @evidence contracts/development/common.md#meaningful-documentation

States what the switch keeps and drops.

## @evidence contracts/development/implementation.md#principled-implementation

A set kinematic pose belongs to the kind being left, so the switch clears it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two field writes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Releases the set kinematic pose.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.setTranslation

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit, what is kept and the previous-centre reset.

## @evidence contracts/development/implementation.md#principled-implementation

A teleport rather than a motion, so the step history restarts at the new centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuses place, then resets the previous centre.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Stores fresh pose records; retains no caller object.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.setRotation

## @evidence contracts/development/common.md#meaningful-documentation

States the pivot, what is kept and the previous-pose reset.

## @evidence contracts/development/implementation.md#principled-implementation

A teleport rather than a motion, so the step history restarts at the new pose; the centre moves with the rotated body-frame centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuses translation and place, then resets the previous pose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Stores fresh pose records; retains no caller object.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.nextTranslation

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit and the fallback when no pose is set.

## @evidence contracts/development/implementation.md#principled-implementation

An unset kinematic pose holds, so the current origin is where the body will be.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A copy of current state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.nextRotation

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and the fallback when no pose is set.

## @evidence contracts/development/implementation.md#principled-implementation

An unset kinematic pose holds, so the current rotation is where the body will be.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional copy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A copy of current state; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh quaternion; retains nothing.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.setNextKinematicTranslation

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, unit, the kept rotation and that the step consumes the pose.

## @evidence contracts/development/implementation.md#principled-implementation

The world's integration places a kinematic body at its set pose and derives its velocities from the change.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record write that keeps the other half of the pose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case; a dynamic body's set pose is ignored by the step and dropped by setDynamic.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one pose until the next step consumes it; retains no caller object.

# src/physics/AutoMovieXpbdBody.ts#AutoMovieXpbdBody.prototype.setNextKinematicRotation

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the kept position and that the step consumes the pose.

## @evidence contracts/development/implementation.md#principled-implementation

The world's integration places a kinematic body at its set pose and derives its velocities from the change.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record write that keeps the other half of the pose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case; a dynamic body's set pose is ignored by the step and dropped by setDynamic.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A mutation; nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one pose until the next step consumes it; retains no caller object.
