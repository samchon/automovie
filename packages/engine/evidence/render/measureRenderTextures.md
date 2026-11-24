# src/render/measureRenderTextures.ts#measureRenderTextures

## @evidence contracts/development/common.md#meaningful-documentation

States when the phase runs, what it adds to the material table, which rows and gaps it appends, what it returns and its refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the shadow profile the scene or the target settings ask for, completes the material table with the drawn parts' own materials, and closes textures over that table with `measureAutoMovieRenderTextureClosure`, which owns sharing, residency and the conservative storage bounds; asset rows are the owner's own cost and renderer-made textures runtime cost, and unknown or unsafe sums stay `null` with a `not-run` gap.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The inventory's material and texture phase, split from the orchestrator by responsibility as the population and simulation phases are; the orchestrator keeps the order and the totals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unsupported shadow profile refuses, and no unknown texture fact is replaced by an estimate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the drawn models' parts and in the closure rows, after the closure's own work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each inventory runs it once; the shared material table is the orchestrator's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Adds to the caller's material table, rows and gaps and returns fresh closure rows; it retains nothing.
