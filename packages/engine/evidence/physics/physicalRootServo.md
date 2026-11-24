# src/physics/physicalRootServo.ts#physicalRootServo

## @evidence contracts/development/common.md#meaningful-documentation

States the attitude held under each actuation, the servo's error and when it is absent.

## @evidence contracts/development/implementation.md#principled-implementation

Under internal actuation the intended attitude is turned by the stance feet's latched heading (design-4017-qp3, Section 1, rule 2; Pratt et al., M2V2, Section VII-C) and the servo acts on an error saturated at `physicalStanceBalance.TORSO_ERROR`; the servo is `AutoMoviePhysicalTracking.torque` over the root's three axes, damped against the authored angular velocity and scaled by the strength.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The attitude, then the servo; the heading's mean turn is one file-private helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts; one non-null assertion spreads the root torque the guard found.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the stance limbs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalRootServo.ts#physicalRootServo.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents the attitude and the moment with their frame and units.

## @evidence contracts/development/design.md#principled-representation

The two values the root tracker reads from the servo.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by trackPhysicalRoot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members; the moment is zero without a servo.
