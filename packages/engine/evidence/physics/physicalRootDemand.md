# src/physics/physicalRootDemand.ts#physicalRootDemand

## @evidence contracts/development/common.md#meaningful-documentation

States the stance's and the mass centre's tasks, how the feet bear, how the trunk is held and when the integral advances, and that the input is never written.

## @evidence contracts/development/implementation.md#principled-implementation

The stance's task is `physicalStanceBalance.demand`, balancing by the centre of pressure with the trunk's servo and the swinging hips' reaction (Yin, Loken and van de Panne 2007, Section 3.2), each foot by its shares and a foot that is not flat toward its ankle (Coros, Beaudoin and van de Panne 2010, Section 3.3); the trunk's spin turns it toward the intended attitude at stiffness over damping on a saturated error (Feng et al. 2013, Section III-B). Without a planted stance the task is `physicalCentroidalTask`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The feet's shares and the body's momentum, then the stance's demand or the mass centre's servo, then the integral and the trunk's spin.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts; non-null assertions read each stance limb's own joint and parent segment.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the segments for the momentum and in the stance limbs for the shares.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one substep's readings.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the integral it returns is a copy the caller adopts.

# src/physics/physicalRootDemand.ts#physicalRootDemand.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents the task's wrench and the integral after the step.

## @evidence contracts/development/design.md#principled-representation

The world's root task before its transitions, and the integral as a value the caller writes back.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by trackPhysicalRoot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The integral is absent without a planted stance or a kept integral.

# src/physics/physicalRootDemand.ts#physicalRootDemand.integrate

## @evidence contracts/development/common.md#meaningful-documentation

States what the integral reads, when it is frozen or reset, what it keeps and that it works on a copy.

## @evidence contracts/development/implementation.md#principled-implementation

The realized centre of pressure is the measured contacts' impulse-weighted mean (Stephens 2011, Eq. 5.31) and the step is `physicalStanceBalance.integrate`; the swinging limbs' key resets it, and the command is kept for the step choice (`AutoMoviePhysicalBalance.assess`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One copy, one weighted mean, one integration step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the supports and the stance feet.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the copy is returned.

# src/physics/physicalRootDemand.ts#physicalRootDemand.external

## @evidence contracts/development/common.md#meaningful-documentation

States the external force and moment, the weight compensation and the limits.

## @evidence contracts/development/implementation.md#principled-implementation

The force is `AutoMoviePhysicalTracking.force` toward the root's goal with the weight compensated and the total held within the strength's share of the maximum root force; the moment is the servo's with the gravity compensation moment, each axis held within the strength's share of the maximum root torque.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The force, then the moment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
