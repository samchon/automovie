# src/core/ArchetypeTrackRange.ts#ArchetypeTrackRange

## @evidence contracts/development/common.md#meaningful-documentation

States the real articulation owner, travel units, refusal axis and returned neutral record.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the existing articulation kinds and range owner. The prior 1e-9 numerical margin at both range ends is retained unchanged; every reached travel must also be finite.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the neutral articulation, obtain its range, admit the listed travels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No range, articulation kind or tolerance is widened and no offending travel is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One neutral model pose and affordance lookup, then linear work in the listed reached travels. Neutral posing retains its existing model-size cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returns the same checked articulation so swing can require a hinge without posing a second model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No cache, model history or external resource is retained.
