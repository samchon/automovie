# src/production/IAutoMovieProductionLipSyncJoin.ts#IAutoMovieProductionLipSyncJoin

## @evidence contracts/development/design.md#principled-representation

joinAutoMovieDialogueVisemes selects exactly one supplied speaker binding and validates ordered line/viseme frame ranges, inserting rest gaps. It returns actor and composition metadata; final-byte provenance and actual actor existence remain caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union separates usable actor composition metadata from a missing-join fact, leaving the viseme timeline and actual expression sampling in their own records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Speaker identity is not guessed from cast order, external audio receives no fabricated phonemes, and mouth motion is not shifted to delayed listener arrival.

## @evidence contracts/development/common.md#meaningful-documentation

Defines explicit supplied-binding selection, emission clock, intended mouth composition, unavailable-binding reasons and current actor-application/host limits.
