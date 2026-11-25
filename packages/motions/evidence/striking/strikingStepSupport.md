# src/striking/strikingStepSupport.ts#strikingStepSupport

## @evidence contracts/development/common.md#meaningful-documentation

States which cuts need support readback and where the floor comes from.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the entering support flags and rig sole geometry to carry the known bearing side or preserve an already unsupported seam.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional bearing side and one floor-relative baseline for each airborne foot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the rig's own heel and ball, keeping the displayed ankle and rotation at the cut.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads at most two sole points per foot once when planning a cut.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each incoming owner reads the same fixed floor and initial placement through its own landing window.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result holds the bearing side, at most two foot placements and their initial vertical offsets. It holds no time observations.
