# src/film/productionVisualDeliveryOccurrence.ts#productionVisualDeliveryOccurrence

## @evidence contracts/development/implementation.md#principled-implementation

Position, frame span and shot together identify an occurrence uniquely within one timeline, because segment positions are distinct, and spelling them into one string makes equality of occurrences string equality.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One template literal is the whole rule, kept in one function so the delivery validator, the conform and its tests derive the same key.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No shot or segment is special-cased; the `occurrence:` prefix is the key's fixed namespace, not a compensation.

## @evidence contracts/development/common.md#meaningful-documentation

The doc gives the exact key grammar, the meaning and unit of each part, which consumers join on it, and which edits change it.

## @evidence contracts/development/implementation.md#efficient-algorithms

The call does constant work beyond copying the shot id into one new string.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call formats one short key from one segment, so caching would cost more than formatting.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The occurrence key is a new string the delivery join compares and discards; the segment argument is read, not referenced afterward, and no handle or task is opened.
