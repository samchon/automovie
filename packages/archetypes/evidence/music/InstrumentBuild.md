# src/music/InstrumentBuild.ts#InstrumentBuild.create

## @evidence contracts/development/common.md#meaningful-documentation

Describes the compatibility draw and the local model it fills.

## @evidence contracts/development/implementation.md#principled-implementation

Draw one value per dimension from the instrument's bands. One construction consumes those dimensions and records the mass.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keep draw and model assembly together, separate from shape construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserve the published parameter checks and contact conventions.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw pass over the profile's bands and one construction pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All five named instruments share the draw and checks for dimensions belonging to other instrument profiles.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input or draw state between calls.
