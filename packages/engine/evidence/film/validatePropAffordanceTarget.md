# src/film/validatePropAffordanceTarget.ts#validatePropAffordanceTarget

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the cited node through the registry's own declaration list, so absence and ambiguity are distinct findings, then matches the affordance by id on the cited model and its kind against the one kind each relation physically needs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One gate for prop-to-prop contact, kept apart from the building-target gate in `validatePropPlacements` because it reads another prop's model rather than an environment.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only `on-support`, `attached` and `suspended` admit a prop-affordance target under the relation kind table, so the three-way kind choice has no dead arm, and no prop or affordance id is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States each rule in order, the kind each relation needs, the reported paths, and why later rules are skipped after a failure.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One scan of the cited model's affordances, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Judges one relation per call; the registry index it reads is built once by the caller.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing and appends at most one violation per call.
