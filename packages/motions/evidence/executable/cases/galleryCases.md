# src/executable/cases/galleryCases.ts#galleryCases

## @evidence contracts/development/common.md#meaningful-documentation

Lists the cases, the poses they show and the frame checks.

## @evidence contracts/development/implementation.md#principled-implementation

Each pose sets named clinical angles on a full zero pose, so every other joint stands at clinical neutral.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A pose table mapped to instants.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Verdicts read world positions from forward kinematics, not from the pose table.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per run.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Plain data.
