# src/physics/physicalStanceJointTarget.ts#physicalStanceJointTarget

## @evidence contracts/development/common.md#meaningful-documentation

States the three roles, the reference each holds, and the target and velocity formulas.

## @evidence contracts/development/implementation.md#principled-implementation

The planted foot holds its latched world orientation (Coros, Beaudoin and van de Panne 2010, Section 3.3). The stance hip holds the trunk's intended world orientation over the actual thigh, SIMBICON's world-frame torso PD (Yin, Loken and van de Panne 2007, Section 3.2). Every other joint keeps the refit goal posture, as TSID's posture task keeps a fixed reference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Picks the desired parent and child world rotations by role, then forms the relative rotation and velocity once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts and no non-null assertions. The role is a discriminated union, so each role's reference is present by type.

## @evidence contracts/development/implementation.md#efficient-algorithms

A constant number of quaternion products per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments, called once per joint per substep; there is nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; its result is a fresh record.

# src/physics/physicalStanceJointTarget.ts#physicalStanceJointTarget.IPair

## @evidence contracts/development/common.md#meaningful-documentation

States each rotation and spin.

## @evidence contracts/development/design.md#principled-representation

World unit quaternions and angular velocities in radians per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by trackPhysicalWorld for both the actual and the goal pose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's quaternion and vector records.

# src/physics/physicalStanceJointTarget.ts#physicalStanceJointTarget.IPlanted

## @evidence contracts/development/common.md#meaningful-documentation

States the role and the latched rotation.

## @evidence contracts/development/design.md#principled-representation

A world unit quaternion latched when the stance began.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The planted role's only reference.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A union member, so no optional reference stands in for a role.

# src/physics/physicalStanceJointTarget.ts#physicalStanceJointTarget.IHip

## @evidence contracts/development/common.md#meaningful-documentation

States the role and the parent's intended rotation and spin.

## @evidence contracts/development/design.md#principled-representation

A world unit quaternion and an angular velocity in radians per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The hip role's only reference.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A union member, so no optional reference stands in for a role.

# src/physics/physicalStanceJointTarget.ts#physicalStanceJointTarget.IPosture

## @evidence contracts/development/common.md#meaningful-documentation

States the role.

## @evidence contracts/development/design.md#principled-representation

The role tag alone; the goal pose is common to every role.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The posture role needs no reference of its own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A union member.

# src/physics/physicalStanceJointTarget.ts#physicalStanceJointTarget.IInput

## @evidence contracts/development/common.md#meaningful-documentation

States that the input is one of the three roles.

## @evidence contracts/development/design.md#principled-representation

A discriminated union on `role`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by trackPhysicalWorld.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

There are no optional references.

# src/physics/physicalStanceJointTarget.ts#physicalStanceJointTarget.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States the relative rotation and the relative velocity with their frame.

## @evidence contracts/development/design.md#principled-representation

A unit quaternion and an angular velocity in radians per second, in the parent's anchor frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by configurePhysicalJointMotor through trackPhysicalWorld.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Two required members.
