# src/physics/IAutoMovieSamplePhysicalRecoverySupport.ts#IAutoMovieSamplePhysicalRecoverySupport.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Causal support-controller activity and the accepted displacement at a replay instant.

## @evidence contracts/development/design.md#principled-representation

active describes an unresolved recovery interval; offset is a world translation in metres selected only from landings at or before the requested time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

samplePhysicalRecoverySupport returns a new offset vector, choosing the latest retained endpoint offset or the adopted root offset after an authored handoff.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absent state yields inactive and zero offset. A future completed landing cannot modify an earlier sample; active does not assert actual floor contact.
