# src/architecture/requireBuiltOpening.ts#requireBuiltOpening

## @evidence contracts/development/implementation.md#principled-implementation

A first-match linear lookup over `environment.openings`, so on a validated record, where ids are unique, the answer is the one opening with that id, and an unvalidated duplicate resolves to its first declaration as `Array.prototype.find` defines.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one refusal shared by the panel-placement and swept-envelope queries, which each kept a private copy of the same message.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no opening or environment; an undeclared id always throws rather than answering an empty panel list a caller could not tell from an opening without an operation.

## @evidence contracts/development/common.md#meaningful-documentation

States that the result is the record itself, the exact refusal and what its message names, and the first-match reading of a duplicate id that validation refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time is linear in the declared opening count with constant space; one lookup per query call does not justify building an id index the caller would discard.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A single synchronous lookup that coordinates nothing across calls; a caller resolving many ids over one record owns any index it keeps.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned opening is the caller's own record object.
