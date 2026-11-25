# src/dressing/HumanWorn.ts#HumanWorn.frame

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The socket's `+Y` turned onto the region's inward normal exactly and the wearable's front (its `+Z`, or its `+Y` where the socket runs along `Z`) onto the body's forward (or up) as nearly as that allows (`HumanHand.align`); the origin follows so the socket lies on the region's point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The fixed site's frame at one turn (`prepareSite`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A wearable without its socket is refused with its contacts.

## @evidence contracts/development/implementation.md#efficient-algorithms

One socket lookup, one region read and one alignment; a caller trying many turns prepares the site once instead.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `prepareSite`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/dressing/HumanWorn.ts#HumanWorn.prepareSite

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed inputs, the two readers with their units and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The socket and the alignment do not depend on the turn, so only the turn's rotation about the region's normal and the translation are computed per call.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Socket, region, alignment, then the two readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The point is the region's own, never one reconstructed from a placed wearable.

## @evidence contracts/development/implementation.md#efficient-algorithms

One socket lookup, one region read and one alignment serve every turn; each turn costs constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The site is shared only across one fixed body, posture, wearable and region.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The readers hold the socket, the region and the alignment until the caller drops them; each result is a fresh record.

# src/dressing/HumanWorn.ts#HumanWorn.prepareMoving

## @evidence contracts/development/common.md#meaningful-documentation

States what varies per call, the units and when the refusal is raised.

## @evidence contracts/development/implementation.md#principled-implementation

The same placement as `frame`, with the region read on each call's own posture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Socket, region reader and the wearable's rest basis bound at the first call; each call reads its region, aligns and places.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No region or frame of an earlier call is reused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per call one region read on the region's bone chain and one alignment.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the body's, the wearable's and the region's fixed data are bound once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds the socket, the region reader and the rest basis until the plan that owns it is dropped; each frame is a fresh record.
