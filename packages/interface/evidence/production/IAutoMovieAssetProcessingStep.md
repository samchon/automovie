# src/production/IAutoMovieAssetProcessingStep.ts#IAutoMovieAssetProcessingStep

## @evidence contracts/development/design.md#principled-representation

An ordered processing step records executable identity, operation and serializable scalar parameters sufficient to describe the authored transformation; actual current bytes retain their independent manifest digest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One step owns its tool, command and parameter map, while the asset provenance owns order, original acquisition and final-byte identity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A recorded command does not prove reproducibility or trigger execution. Nonblank tool/command and current-byte verification remain host premises after production inventory retirement.

## @evidence contracts/development/common.md#meaningful-documentation

Gives version-sensitive tool identity, exact operation and scalar parameter intent, and distinguishes declared processing history from compiler replay.
