# src/film/validateShotPhysicsAdvice.ts#validateShotPhysicsAdvice

## @evidence contracts/development/implementation.md#principled-implementation

One pass with a first-index map for ids, and each decision checked as a predicate over the advice union's documented branches; response equality is `JSON.stringify` of a key-sorted deep copy, which holds for the plain finite-number records `suggestCollisionResponse` produces but would equate a non-finite number with `null` and `-0` with `0`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split from `compileDefinedShot` as the one owner of the advice rules, so the compiler only sequences phases; the key-sorting helper stays private because no other rule compares advice responses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no advice id, fixture or collision shape; a decision that disagrees with its payload is reported rather than coerced into the nearest valid branch.

## @evidence contracts/development/common.md#meaningful-documentation

States every id and decision rule, how responses are compared, that an empty result means valid, and that the advice is checked but never applied.

## @evidence contracts/development/implementation.md#efficient-algorithms

Traverses the advice list and both compared responses, adding sum(K log K) for each object's K sorted keys before serializing each side once; work scales with the actual nested response shapes rather than advice count alone.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure check over one runtime's advice list that coordinates no work across calls or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the id map and diagnostics during the call; the caller owns the returned diagnostics, at most two per advice item.
