# src/weapons/assembleCostumeArmour.ts#assembleCostumeArmour

## @evidence contracts/development/implementation.md#principled-implementation

Uses the body's own rest joint positions and anthropometric measure to place each piece's documented wear centre on the segment it covers, then expresses that frame in the slot bone's chained rest rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit one piece per named slot, preserve its id, locate its segment on the rest body, then compute its worn binding.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No detached layer, duplicate geometry, baked actor mesh or fixed offset. Mismatched or reused pieces and bodies without the slot's joints refuse.

## @evidence contracts/development/implementation.md#efficient-algorithms

Processes at most eight pieces, each with one bone-chain walk of at most the rig's depth.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses canonical wear contacts, the body's rest record and the shared prop binding contract.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned bindings reference only the caller's models and independently owned offset records.

## @evidence contracts/development/common.md#meaningful-documentation

Names the slots, the segment each piece covers and how its centre and axes are placed.
