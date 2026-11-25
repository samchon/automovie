# src/everyday/prepareRisePalmRoll.ts#prepareRisePalmRoll

## @evidence contracts/development/common.md#meaningful-documentation

Takes the actual supported seat-off posture, free thigh contacts and a phase share. It returns fresh changed goals only for the obstructed forearms.

## @evidence contracts/development/implementation.md#principled-implementation

A signed vector angle on the material plane picks the roll; rotating about the actual palm point gives the matching wrist translation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Determine the obstructed sides and their tangent angles at seat-off, then apply the phase share to their original palm goals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No armrest, contact normal, target radius or joint bound is changed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each free forearm has one material check at load transfer. Its moving goal needs one rotation and translation per active read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same immutable tangent angle and palm-local frame are used throughout the support phase.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most two side, frame and angle records live with the action.
