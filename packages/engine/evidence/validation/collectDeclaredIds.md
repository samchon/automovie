# src/validation/collectDeclaredIds.ts#collectDeclaredIds

## @evidence contracts/development/implementation.md#principled-implementation

One pass with a hash set decides uniqueness exactly by string equality, and blankness uses the collector's trim rule; returning every id, defective ones included, keeps a single defect from cascading into unresolved-reference reports.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The declaration rule the building, lineage and design-reference validators each kept as an identical private `collectIds`, now one helper beside the collector they all write to.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No record kind or id is special-cased; the label only names the record in the message.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states both violation kinds with their paths and messages, which record a repeat is reported on, and why defective ids stay in the returned set.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) expected time and space for n records, one set insertion and lookup each, instead of a pairwise comparison.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call judges one list of one record; callers keep the returned set and reuse it for every reference into that list.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a set bounded by the record count, which the caller owns, and appends at most two violations per record to the collector; nothing else is retained.
