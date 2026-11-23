# src/caption/index.ts#serializeAutoMovieWebVttIdentifier

## @evidence contracts/development/implementation.md#principled-implementation

Preserving the value and refusing what the grammar cannot carry is the only reversible choice, because any substitution would publish a different id than the timeline holds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The rule lives in `isAutoMovieWebVttIdentifier`; this function is the throwing form `canonicalProductionWebVtt` needs, while film assembly uses the predicate to report a diagnostic.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

It never trims, replaces or escapes a malformed id to make serialization succeed; the throw surfaces the invalid input.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states that the value is preserved verbatim, why it is not escaped, which values are refused, and that refusal throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

The cost is the predicate's single O(L) scan, and the input string is returned without copying.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Validating one string coordinates no phases and leaves nothing a later call could reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No state, handle or task outlives the call; the returned value is the caller's own string.
