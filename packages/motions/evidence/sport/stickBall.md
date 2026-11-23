# src/sport/stickBall.ts#stickBall.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the data, result and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A world cue determines the placed working frame, and each shaft grip remains local to that frame. A hand the entry does not record holding the stick is carried from its entry arm onto its grip over a reach-to-grasp time (McIntosh, Mon-Williams and Tresilian 2018) before the stick moves, so the arms stay continuous at the stroke's start.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the cue and frame path before composing two arm goals and publishing custody.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Named props supply their dimensions. An arm-length bound admits the requested grip positions, and an ice puck launches only after the fitted grips put the finite blade face within the contact allowance.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sizing read per prop, two local observations of the hockey arm fit at grip closure and contact, and no repeated fit admission during playback.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the shared clock, posture carrier, placed arm and prop trajectory owners.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Keeps only prepared frames, clock and the arm goals. Retains no past sampled frames.
