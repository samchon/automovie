# src/sport/handspringKeys.ts#handspringKeys.lunged

## @evidence contracts/development/common.md#meaningful-documentation

States the left-leading lunge, provisional clinical angles and returned body-dependent key; handspring.lunged preserves this exact constructor alias and shape.

## @evidence contracts/development/implementation.md#principled-implementation

An ExerciseKey on the given body, with its existing lunge angles and the body's own relaxed defaults.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One constructor call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No angle or timing changes in this extraction.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

No algorithm is chosen.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses ExerciseKey.from.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/sport/handspringKeys.ts#handspringKeys.arched

## @evidence contracts/development/common.md#meaningful-documentation

States the provisional arched line shared by the wheel and flight; handspring.arched preserves this exact constructor alias and body-dependent defaults.

## @evidence contracts/development/implementation.md#principled-implementation

An ExerciseKey on the given body with the handspring's existing arch and the body's own relaxed defaults.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One constructor call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No angle or timing changes in this extraction.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

No algorithm is chosen.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses ExerciseKey.from.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
