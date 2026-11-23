# src/executable/cases/everydayGestureVerdicts.ts#everydayGestureVerdicts

## @evidence contracts/development/common.md#meaningful-documentation

States each gesture's check, its threshold and its source or provisional status.

## @evidence contracts/development/implementation.md#principled-implementation

Reads displayed bones and joint angles over the stroke on a 48 Hz grid and counts swings as local extremes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One switch over the gesture with shared samplers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Measures the performed motion, never the law's plan.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in stroke frames.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Run once per capture.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
