# src/production/IAutoMovieProductionSoundEvidence.ts#IAutoMovieProductionSoundEvidence

## @evidence contracts/development/design.md#principled-representation

The record pairs the semantic sound plan, PCM analysis and supplied synthesis receipts with sibling audio byte identity; its type does not compare identities or reopen resident delivery bytes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separates semantic intent, measured PCM, dialogue provenance and encoded audio while fixing the measurement source and algorithm in a small explicit record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Pre-encode measurements do not claim decoded-final-audio loudness, and event-window analysis cannot isolate event energy; callers must establish that the claimed sibling identity matches final bytes because this DTO performs no admission.

## @evidence contracts/development/common.md#meaningful-documentation

Defines evidence epoch, current plan, pre-encode analysis source, synthesis receipt population, sibling audio identity and closed measurement algorithm.
