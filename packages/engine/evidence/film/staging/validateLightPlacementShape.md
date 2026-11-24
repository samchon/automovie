# src/film/staging/validateLightPlacementShape.ts#validateLightPlacementShape

## @evidence contracts/development/implementation.md#principled-implementation

Derives the kind once through `lightTypeOf` and then requires or forbids each field by the kind's physical meaning, aim for every kind but point, position for every kind but directional, falloff range only for point and spot, and reads every authored value as `unknown` until a shape and finiteness test admits it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns light aim, position, range and cone with private extent and shadow helpers; the full color record delegates to validateColor so staged lights, materials and backgrounds share shape, channel and display-label rules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No value is defaulted or clamped to pass, the area-shadow refusal is a stated rendering fact rather than a fixture exception, and no node or role is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States per-kind ranges, color and shadow rules, inapplicable-parameter refusal, the caller's record premise and ordinary-field conversion fallback with its limits.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Checks a fixed field population per placement; refusal adds conversion/output-sized text with no time bound on user-defined hooks, and stageScene invokes the gate once per light.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Judges one placement per call and coordinates no work across placements or calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; it appends at most one violation per checked field to the caller's collector, which owns them.
