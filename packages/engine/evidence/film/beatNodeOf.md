# src/film/beatNodeOf.ts#beatNodeOf

## @evidence contracts/development/implementation.md#principled-implementation

A linear search for the first node whose kind is `beat` and whose payload names the beat; the one-to-one join that `validateScriptTree` enforces makes the first match the only match on a committed tree.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner of the beat-to-node join, read by `locateOnBeat` and the tests, so no consumer restates the payload match; absent and null trees are accepted because a script may carry no tree.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no beat or node; an unclaimed beat answers null instead of a guessed ancestor, and an uncommitted tree's duplicate claim resolves by the stated first-match rule.

## @evidence contracts/development/common.md#meaningful-documentation

States what the id identifies, both null cases, the invariant it relies on and its owner, the consumer, and the result on an unvalidated tree.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in tree nodes with an early return on the match; an index would cost the same pass to build for the single lookup each caller makes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure lookup over one tree that coordinates nothing across calls; a caller resolving many beats owns any index.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates and retains nothing; it returns an id string the tree already holds.
