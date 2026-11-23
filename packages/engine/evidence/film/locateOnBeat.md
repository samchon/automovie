# src/film/locateOnBeat.ts#locateOnBeat

## @evidence contracts/development/implementation.md#principled-implementation

One `beatNodeOf` lookup resolves the claiming node, then an object spread copies each violation with `node` set, which leaves the inputs untouched; it relies on `validateScriptTree` making the beat-to-node join one-to-one, so the first claimant is the only one.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The beat-to-node join is `beatNodeOf`'s, shared with every beat-scoped consumer; this function only applies it to a violation list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every violation in the list is stamped the same way; an unclaimed beat yields an unstamped copy rather than a guessed node.

## @evidence contracts/development/common.md#meaningful-documentation

States what `node` is set to and why, the unclaimed and missing-tree result, that an existing `node` is overwritten, and that neither the list nor its entries are mutated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the tree size for the one lookup plus linear in the violation count for the copy; the lookup runs once, not per violation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure transformation of one list that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned list and its copies.
