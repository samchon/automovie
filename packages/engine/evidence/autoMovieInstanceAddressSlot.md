# src/autoMovieInstanceAddressSlot.ts#autoMovieInstanceAddressSlot

## @evidence contracts/development/implementation.md#principled-implementation

Parses the slot form directly instead of generating every member's address, so resolving one member of a large compact set never expands it; an explicit layout is matched by its authored ids because those are its addresses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The parsing half of the member address grammar, kept beside `autoMovieInstanceAddress` so the two forms change together.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No set or member is special-cased; a malformed or out-of-range address is null rather than coerced to a nearby slot.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states both forms, the exact digit count, the range rule and why it matters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time for a generated layout and linear in the explicit transform count for an explicit one, never linear in a generated set's count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure parser of one address that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates at most a prefix and a suffix string and retains nothing.
