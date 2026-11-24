# src/touch/touchStance.ts#touchStance

## @evidence contracts/development/common.md#meaningful-documentation

States the choice, its premises, the step's owner and time windows, and the refusal naming both candidates.

## @evidence contracts/development/implementation.md#principled-implementation

The stance is chosen between the existing base and one step, in that order, as Vahrenkamp et al. 2013's Algorithm 1 tries the law's declared candidates (`AutoMovieMotionHumanTouchStance.choose`): the step moves the performer toward the unchanged work point only where the base's shoulder, heel and lean do not reach, its landed stance accepted when its try passes (`reaches`). The same foot course and plant windows serve pick-up and touch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two candidates of one choice, each with its base builder.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The adjusted stance still has to pass the same reachable shoulder-to-wrist share. A seat, carrier or self contact supplies no step.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reachable touches solve the stance once. A failed planted reach alone computes the shared bounded step and admits the stance on its final posture.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same step, time share, leg goals and contact windows as the pick-up law.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The active plan keeps one stance and the chosen step's parameters. It keeps no queried posture or time history.
