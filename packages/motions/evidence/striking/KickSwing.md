# src/striking/KickSwing.ts#KickSwing.create

## @evidence contracts/development/common.md#meaningful-documentation

States the fitted chamber/contact, knee hinge, world plant, timing and optional exact same-base hip of the returned path.

## @evidence contracts/development/implementation.md#principled-implementation

Keeps the pelvis-local knee/shank and hinge rotation and the minimum-jerk opening with its speed/flexion bounds; the lift and the lowering turn the thigh and the shank between the planted leg, solved from the current hip, and the chambered leg on minimum-jerk shares, the ankle by forward kinematics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed contact-frame geometry is prepared once and the returned time reader carries it by the current body's heading and one shared hip; one segment-turn helper serves the lift and the lowering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every clock, band, hinge angle and weight remains; the planted ankle is met exactly at either end of the arc even when the hip stands farther from it than the leg is long, the shank then carrying the excess that the share blends out; a supplied hip must belong to the same body/base currently being evaluated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant path arithmetic plus one hip FK when the caller has not already read it; the planted triangle is solved in closed form only during the lift and the lowering; ankle and knee share that hip and superposed paths may borrow the same exact value.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Contact-local vectors and the hinge are fixed by the actual fitted contact; same-call knee/ankle and superposed candidate paths share only the exact current base's hip, never a pose from another time or context.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned path keeps fixed contact geometry and plant/timing data for its plan lifetime; each evaluation retains no current posture, hip or query history after returning its fresh leg goal.
