# src/lexicon/HumanCarriedGripGaps.ts#HumanCarriedGripGaps.gap

## @evidence contracts/development/common.md#meaningful-documentation

States the distance and its sign.

## @evidence contracts/development/implementation.md#principled-implementation

A bearing palm faces the held surface, so its hand offset fixes the wrist goal tested against the arm span.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prepared wrist reader and one distance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the held surface's real current normal and the same palm offset as playback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads only the modeled shoulder and wrist, with no elbow solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The stance and further helper use the same prepared wrist gap.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after the observation.
