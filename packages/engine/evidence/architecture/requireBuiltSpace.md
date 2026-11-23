# src/architecture/requireBuiltSpace.ts#requireBuiltSpace

## @evidence contracts/development/implementation.md#principled-implementation

A first-match linear lookup over `environment.spaces`, so the answer for a validated record, where ids are unique, is the one space with that id, and an unvalidated duplicate resolves to its first declaration as `Array.prototype.find` defines.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one refusal shared by every space-addressed architecture query, so the message and the first-match rule live in one place instead of a private copy per query file.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no space, environment or caller; an undeclared id always throws rather than being answered with an empty result that a caller could not tell from a real empty room.

## @evidence contracts/development/common.md#meaningful-documentation

States that the result is the space record itself, the exact refusal and what its message names, and the first-match reading of a duplicate id that validation refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time is linear in the declared space count and space is constant; one lookup per query call does not justify building an id index the caller would discard.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single synchronous lookup that coordinates nothing across calls; a caller resolving many ids over one record owns any index it wants to keep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned space is the caller's own record object, not a copy this function holds.
