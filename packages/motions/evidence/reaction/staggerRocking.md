# src/reaction/staggerRocking.ts#staggerRocking

## @evidence contracts/development/common.md#meaningful-documentation

States the entry rocker and shared landing goal, their owner, and their timing.

## @evidence contracts/development/implementation.md#principled-implementation

Couples the ankle rotation and its contact offset so the actual stance is reached continuously. The same landing fit reference governs the step's approach and ensuing stance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the two entry feet, then read the current settled recovery once to write the leg goals and trunk.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the exact display entry, ankle geometry, contact windows and settled root. No body-specific default or threshold is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Writes one root, two ankle goals and two knee poles. Only the reaction blends the entry rocker, and no new FK is requested while writing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same two placed feet and settled root the stagger plan already reads. The direct toe angles accompany the same rocker as their corresponding leg goal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

References are finite, one per admitted step. Current geometry is used synchronously and no posed frame or queried time is retained.
