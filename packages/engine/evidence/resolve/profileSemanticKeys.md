# src/resolve/profileSemanticKeys.ts#profileSemanticKeys

## @evidence contracts/development/implementation.md#principled-implementation

Enumerate supported limit/driver node references, exclude global pointers and deduplicate in first-reference order, matching fields bindProfile remaps.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A set-backed collector lets forgeProp report all absent mappings before concrete binding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown driver kinds throw and no key is inferred from unrelated payload names or fixture ids.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify demanded boneMap entries, pointer exclusion and deterministic order.

## @evidence contracts/development/implementation.md#efficient-algorithms

L limits, D drivers and R chain references cost O(L+D+R), with O(K) distinct-key storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One local set shares repeated references across the profile; changed authored data requires fresh enumeration.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned key array, with no bound graph, profile cache, native handle or task retained.
