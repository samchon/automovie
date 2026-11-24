# src/motion/human/law/IAutoMovieMotionHumanFlight.ts#IAutoMovieMotionHumanFlight

## @evidence contracts/development/common.md#meaningful-documentation

A performer's airborne interval expressed as shares of the action's duration, with its angular-momentum or requested-turn specification. Performance flight planning resolves the declared rotation independently of evaluation order.

## @evidence contracts/development/design.md#principled-representation

from: Take-off, a share of the action's duration. to: Touchdown, a share of the action's duration, after `from`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Action plans declare airborne windows and HumanPerformanceFlight resolves the whole-body rotation after action composition; momentum and turns are separately named alternatives.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Takeoff/touchdown remain duration shares; the optional touchdown requirement travels with the flight it constrains. HumanPerformanceFlight converts that interval and owns flight solving; declaring the record alone does not certify a reachable turn count.

# src/motion/human/law/IAutoMovieMotionHumanFlight.ts#IAutoMovieMotionHumanFlight.ITouchdown

## @evidence contracts/development/common.md#meaningful-documentation

States the landing's requirement on the rotation a flight hands back: the ground phase's adopted yaw, the shooting residual limit and the check of the received rotation.

## @evidence contracts/development/design.md#principled-representation

The requirement belongs to the flight its action declares, so the flight solver reads it from the flight record instead of a table keyed by the request.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, read by the performance's flight pass and checked against the rotation it hands back.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The required angle is a target for the original solver and grants no ability to override the physical result.