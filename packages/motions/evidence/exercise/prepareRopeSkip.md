# src/exercise/prepareRopeSkip.ts#prepareRopeSkip

## @evidence contracts/development/common.md#meaningful-documentation

States the active clock, handle axes, cord length, staging status and host ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The sagitta and flight parabola bound the turn. The cable begins at the two drawn handle tips and its center lies on their chord's bisector. Squaring the length equation gives the transverse span in closed form.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the opening stance and action clock once. Each draw reads one displayed bone map to place both handles, fits the cable once and checks the underpass against both actual feet.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An inadmissible cable or obstructed underpass is refused. The actor's grasp, cord length and action clock are preserved.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation scans the performer's segments and the action's events. Sampling uses one displayed pose, four cable vertices and each foot's fixed sole outline.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both handles and the clearance witnesses use the same displayed bone sample. The winding and stance geometry are prepared once for this action.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the borrowed performance, the selected action bounds and a fixed size geometric setup. Each returned frame owns plain data and no native resources.
