# src/actions/rangeSteppingFoot.ts#rangeSteppingFoot

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed forefoot, changing heel, ankle limit in degrees and actual lowered posture.

## @evidence contracts/development/implementation.md#principled-implementation

Solves the available ankle angle about the authored metatarsal contact against the current hip position and preserves the forefoot attitude by the opposite toe rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the one moving foot and hip, finds the existing rocker solution and writes the two affected joint demands.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the original contact, heading, body measurements, current hip and supplied load-dependent range.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hip read and one bounded one-dimensional rocker solve for the active foot. A foot already inside its range returns the input posture.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses hipJoints, walkLeg.heelRise and HumanFoot.pivot for the same ankle geometry in a brace and jump push-off.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

All temporary geometry is local to this evaluation.
