# src/perform/HumanScheduleRefusal.ts#HumanScheduleRefusal

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and which errors pass through.

## @evidence contracts/development/implementation.md#principled-implementation

Each code maps to the refusal class repaired at the same place: a missing anchor is a missing participant, a wrong event, index or duplicate id is a parameter, a cut outside the span is a cut.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One switch over the code, each arm one refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A duplicate anchor lists no alternatives, because the ids in use are exactly what the new one must differ from; they are named in the reason instead.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
