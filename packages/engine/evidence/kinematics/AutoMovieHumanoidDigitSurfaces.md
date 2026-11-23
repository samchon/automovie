# src/kinematics/AutoMovieHumanoidDigitSurfaces.ts#AutoMovieHumanoidDigitSurfaces

## @evidence contracts/development/common.md#meaningful-documentation

States where each tip and pad lies, the palmar direction's premise, the fallback to the hand's colliders and the frame of the result.

## @evidence contracts/development/implementation.md#principled-implementation

Exact ray exits through the phalanx's convex colliders from anatomical stations (the last joint along the phalanx; the phalanx's middle toward the palm), each normal the exited collider's own, the method every rayed region uses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over sides and digits writes two frames each, through the caller's own ray readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every length is the body's own joints and colliders; the index tip keeps the station, direction and bone it had, so its frame is unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Twenty rays, each linear in one segment's colliders, once per body.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the body; its caller resolves once per body.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.
