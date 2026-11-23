# src/lexicon/HumanCarriedNeckClear.ts#HumanCarriedNeckClear

## @evidence contracts/development/common.md#meaningful-documentation

States the defect, the measured overlap, the direction and the case left alone.

## @evidence contracts/development/implementation.md#principled-implementation

One signed distance between the placed pelvis and neck colliders gives the overlap; the distance is linear in a backward shift at the contact normal's slope on that direction, so a second distance at the overlap's depth gives the slope and the placement is translated by the overlap over it (one secant step, exact for a flat contact).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The placed pelvis, the neck, their least distance, one translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The shapes are the bodies' own colliders; no depth or radius is typed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pair of collider placements and two passes of their pairwise distances, once per coupling.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per coupling.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned placement closes over one translation.
