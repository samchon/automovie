# src/ensemble/humanCrowdGroupFormation.ts#humanCrowdGroupFormation

## @evidence contracts/development/common.md#meaningful-documentation

Describes the moving centre, input units and member order, density endpoints, refusals, course boundary and formation consumer.

## @evidence contracts/development/implementation.md#principled-implementation

Reconstructs the study's planar adjacent-member bearings and distances, ensuring lateral shoulder clearance at the same bearing, then subtracts the mean offsets before ordinary formation placement. Interpolation and clamping approximate static conditions between two measured populations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One measured table and one adjacent-pair pass generate ordinary one-slot blocks. HumanFormation owns world placement and the walking laws own locomotion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The group sizes and distances follow the observed populations, the sparse bearings follow the study's statistical conclusion, and shoulder clearance comes from the submitted members' breadths.

## @evidence contracts/development/implementation.md#efficient-algorithms

Validation, adjacent reconstruction and centring take linear time and storage in the group size, capped at four members. No pose, course or contact samples are generated.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call constructs one shape. Its returned blocks carry that shape for all subsequent slot reads by the caller.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Owns no handles or retained plan state. The result and its frame stay with the caller.
