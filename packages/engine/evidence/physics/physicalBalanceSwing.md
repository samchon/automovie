# src/physics/physicalBalanceSwing.ts#physicalBalanceSwing

## @evidence contracts/development/common.md#meaningful-documentation

States how the landing is re-predicted, how the path and its clearance are set, what the drive adds, and that the input is never written.

## @evidence contracts/development/implementation.md#principled-implementation

The landing is re-predicted through the swing's first half from the present capture point and the time left (Yin et al. 2007, Section 3.3; Khadiv et al. 2017, Section III-B) and held after (Pratt et al., M2V2, Section VII-C1). The clearance is what the stance carries at the swing's peak (`physicalStanceBalance.clearance`), raised by the sole's hang (Pratt et al., M2V2, Section VII-D1); the path is `samplePhysicalRecoveryGoal`'s; the drive adds the path's feed-forward through J^T (`physicalStanceBalance.swingForce`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The re-prediction on one copy of the state and the steps' records, then one path, goal and drive per lifted limb; the drives are returned for the caller to apply.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts; non-null assertions read the re-predicted steps and the lifted limbs' segments, which exist while they swing.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one assessment and two paths per substep.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one substep of the swing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalBalanceSwing.ts#physicalBalanceSwing.IDrive

## @evidence contracts/development/common.md#meaningful-documentation

Documents a drive's bone, point and force with their units.

## @evidence contracts/development/design.md#principled-representation

A force at a point on a limb, which the caller applies on the declared actuator path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by the swing and applied by advancePhysicalBalance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members.

# src/physics/physicalBalanceSwing.ts#physicalBalanceSwing.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents the swing's state, goals, drives and path.

## @evidence contracts/development/design.md#principled-representation

The next state and the swing's commands; the path is absent while no limb swings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by advancePhysicalBalance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The path reuses the result type the interface declares.
