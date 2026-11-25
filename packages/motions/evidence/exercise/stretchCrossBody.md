# src/exercise/stretchCrossBody.ts#stretchCrossBody.arms

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result; the namespace gives the places.

## @evidence contracts/development/implementation.md#principled-implementation

The stretched palm is placed so that its wrist lands on the target: the palm point is moved by the palm's own offset from the wrist at that hand's turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One target and two placed arms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every place follows from the body's measure and the posture's root and heading.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed reach/pressure geometry and the actual shoulder rest point prepare once. Each actual arm placement shares one current-yaw frame across its reach/shoulder/facing directions, retaining every current rigid transform and native wrist/arm solve instead of repeating yaw trigonometry per vector.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unchanged body measures, side and entry-forward pressure establish fixed local geometry only; each posture's actual root/yaw still determines its fresh frame/targets. Native Placed.arm/wrist retain hand offset and actual arm-solving ownership.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The two arm rows retain bounded fixed reach/pressure vectors and the body-owned shoulder rest point until release. Each current frame and temporary target ends with its placement callback; no current pose, FK source, evaluated target or time history is retained.
