# src/validation/validateDeclaredReferences.ts#validateDeclaredReferences

## @evidence contracts/development/implementation.md#principled-implementation

Membership in the target set decides resolution exactly, and a second set of references seen so far decides repetition, both by string equality.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The reference rule the building, lineage and design-reference validators each kept as an identical private `validateReferences`, now one helper beside `collectDeclaredIds`, whose set it reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No record kind or id is special-cased; the label only names the target in the message.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states both violation kinds with their paths and messages, that one reference may get both, and where the targets usually come from.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) expected time and space for n references, one set lookup and insertion each.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call judges one reference list against a target set the caller computed once and passes to every list.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The seen set is local and released on return; at most two violations per reference are appended to the caller's collector.
