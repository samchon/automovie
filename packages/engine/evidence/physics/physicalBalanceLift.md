# src/physics/physicalBalanceLift.ts#physicalBalanceLift

## @evidence contracts/development/common.md#meaningful-documentation

States when a step lifts, what lifting commits and how a diagonal pair lifts, and that the input is never written.

## @evidence contracts/development/implementation.md#principled-implementation

A step lifts once the floor measurably carries its limb no more (`physicalStanceBalance.release`); a diagonal pair lifts once both feet are released, one swing phase (Chen et al. 2022, Section 2.1). Lifting gives up the seats, times the steps from now with their durations kept (`physicalRecoverySwing.retime`) and records them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The release check, then one copy of the state with the seats, the steps and their records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

One non-null assertion reads the swing, which exists whenever a step is under way; another reads the released seats, which the release check found.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two steps per substep.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It advances one state by one substep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the step record grows by one entry per lifted step, owned by the caller's state.
