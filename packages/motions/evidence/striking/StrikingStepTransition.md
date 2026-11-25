# src/striking/StrikingStepTransition.ts#StrikingStepTransition.plan

## @evidence contracts/development/implementation.md#principled-implementation

Computes turn and lead geometry once per beat, then solves each posture from its time and active supports.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separates beat geometry, event scheduling and current posture.

## @evidence contracts/development/implementation.md#efficient-algorithms

Plans linearly in beat count, with one indexed beat per posture read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains its beat geometry and entry only.
