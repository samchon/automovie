# src/compose/courseLimbJudgement.ts#courseLimbJudgement

## @evidence contracts/development/common.md#meaningful-documentation

States what is pinned, why the swivel is then the only difference, what is dropped and what is kept.

## @evidence contracts/development/implementation.md#principled-implementation

On a fixed end joint the swivel is the limb's one free coordinate (Tolani 2000), so the judgement isolates the interpolation's error while the prescribed fit keeps its range and clearance checks.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Carry each coursed goal into the world, pin it to the fitted end joint, drop its re-aim terms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the re-aim terms the fitted end joint already satisfies are dropped; clearance, bend and reference are the goal's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

One world carry per coursed limb; the contact re-aim's passes are not run again for a placement whose end joint is already placed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each judgement pins its own middle's end joints.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh goal record; retains nothing.
