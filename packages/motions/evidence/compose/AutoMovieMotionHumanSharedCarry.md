# src/compose/AutoMovieMotionHumanSharedCarry.ts#AutoMovieMotionHumanSharedCarry

## @evidence contracts/development/common.md#meaningful-documentation

Describes the two simultaneous grips, the common path, author responsibilities and the admission boundaries.

## @evidence contracts/development/implementation.md#principled-implementation

CORE4D's simultaneous carry conditions two people's motion on one object. Rigid composition of each fixed local point and hand orientation supplies the planner's moving grip goal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check the span, prop and sites, prepare each carrier once, and expose the same path to the prop reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Never transfers prop ownership to a hand. The arm planner owns its usual contact and range bounds, without frame-dependent guesses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two site lookups and two existing arm trajectory solves at preparation. Each posture read samples just its own joint curve, its hand's planned finger state (`AutoMovieMotionHumanArmPlayed.written`, no digit fitted after the plan) and base posture.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the existing arm planner, grip socket, quaternion composition and performance prop motion hook.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned readers retain their input tracks and their own two solved trajectories; the prop track keeps only its path and endpoints.
