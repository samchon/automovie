# src/actions/run.ts#run.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result; the namespace gives the gait's sources.

## @evidence contracts/development/implementation.md#principled-implementation

The walk's footprint planner in the pace's running gait, whose flight follows from its duty factor below one half.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table read and one delegation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The run adds no planner of its own; every footprint is the walk's.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The plan's cost is walk.locomote's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses walk.locomote.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned plan owns what walk.locomote prepares.

# src/actions/run.ts#run.speed

## @evidence contracts/development/common.md#meaningful-documentation

States the relation, the leg length and what is left out.

## @evidence contracts/development/implementation.md#principled-implementation

The Froude number's definition Fr = v² / (g l), solved for v, with the gait table's number and the planner's own leg length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table read and one closed form.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The number is the gait's, never restated.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
