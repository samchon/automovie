# src/compose/AutoMovieMotionHumanArm.ts#AutoMovieMotionHumanArm

## @evidence contracts/development/common.md#meaningful-documentation

States what a target is and when it is evaluated, how the hand is solved, the path (straight or bowed) and the turn between origin and target, and the frame an origin is held in.

## @evidence contracts/development/design.md#principled-representation

An arm movement is an effector goal blended between a body-carried origin and a per-second target frame by one weight, the form reach-to-grasp studies describe (transport and hand shaping on one time course).

## @evidence contracts/development/design.md#minimal-and-owned-surface

One movement (`move`) with three named weights over it (`reach`, `hold`, `retract`) and the three conversions they need; the only owner of arm goals built from a hand surface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the hand's surface and shape unions and the posture's goal type; no action name and no fixed body size appears.
