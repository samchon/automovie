# src/carrier/HumanMediumWalk.ts#HumanMediumWalk

## @evidence contracts/development/common.md#meaningful-documentation

States each medium's rule, its source and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The water speed scales with the drag ratio by quadratic drag; the yielding speed with the energy equation's terrain factor; the wind lean with the static moment balance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the medium and wind, choose the speed, plan the walk, then adapt each sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The clearance, arm height, wading lean and snow factor are named provisional values; the speeds follow measured or derived rules.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two drag sums at most once; each sample scans the foot's few plant windows.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the walk and the immersed body's drag model.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the walk plan and the plant windows for the action.
