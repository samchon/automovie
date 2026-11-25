# src/climbing/seatLadderAccessGrips.ts#seatLadderAccessGrips

## @evidence contracts/development/common.md#meaningful-documentation

Describes the seating, the easing bound and the two grip forms.

## @evidence contracts/development/implementation.md#principled-implementation

The current torso provides the arm's elbow pole and the grip socket is placed on the staged point of the finite bar while it carries load; outside the window a minimum-jerk blend from the displayed wrist.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares both bar alignments and each hand's schedule once, then one lookup and one arm goal per hand per sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the support law's own targets and windows without inventing a placement.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in a hand's grips per sample; one posture resolve only while easing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The resolved bones of a sample are shared by both easing hands.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains its prepared schedules for the plan's lifetime.
