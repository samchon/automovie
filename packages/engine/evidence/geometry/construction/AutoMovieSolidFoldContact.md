# src/geometry/construction/AutoMovieSolidFoldContact.ts#AutoMovieSolidFoldContact.chords

## @evidence contracts/development/implementation.md#principled-implementation

Reads both outward normals and kept directions as the rail solve does, each wall's normal curvature along its kept direction from its fundamental forms, and solves the two centres' meeting by Gauss-Newton in the two arc lengths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One wall reader, one section reader and one loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance is widened on failure and no chord is invented: null leaves the decision to the caller.

## @evidence contracts/development/common.md#meaningful-documentation

States each input's unit, the result and its null.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two surface jets and at most `STEPS` constant-size steps.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One point's solve shares nothing with another's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local values only; the two numbers are returned.
