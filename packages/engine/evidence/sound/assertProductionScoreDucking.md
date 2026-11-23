# src/sound/assertProductionScoreDucking.ts#assertProductionScoreDucking

## @evidence contracts/development/common.md#meaningful-documentation

Describes the refusal for invalid music gain and whole-frame ramp lengths defined by the sound plan.

## @evidence contracts/development/implementation.md#principled-implementation

Gain must be finite in [0, 1]; both ramps must be nonnegative safe integers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The planner and PCM renderer share this one admission check.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An omitted policy is allowed and malformed values throw without being clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Tests three scalar values in constant time and space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One scalar check per field and no shared intermediate.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no data or resources.
