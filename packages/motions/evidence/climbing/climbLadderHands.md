# src/climbing/climbLadderHands.ts#climbLadderHands

## @evidence contracts/development/common.md#meaningful-documentation

Names both geometric frames.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist fixes the chain endpoint and the trunk-relative elbow pole fixes its bend plane through each rung transfer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reader places the requested wrist, constructs its torso-relative pole and assembles the goal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same rung point and real arm fit retain contact and joint limits at each sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The rung's normal and axis and the hands' grip offsets remain fixed for this climb. Each requested posture supplies its own pole.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The climb owns two frames and offsets. Returned goals retain no earlier pose or fit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two prepared hand frames and grip offsets serve the climb. Each goal constructs its pole directly and the posture solver checks the actual arm configuration.
