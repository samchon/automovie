# src/film/staging/validateCameraClearanceEnvelope.ts#validateCameraClearanceEnvelope

## @evidence contracts/development/implementation.md#principled-implementation

Narrows each level with `isRecord` and each number with `typeof` and `Number.isFinite` before comparing, so a malformed payload becomes a located violation instead of a `TypeError`, and the radius bound is strict because a zero sphere encloses no lens.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One validator per staged camera field, paired with `lowerCameraClearanceEnvelope`; the two spheres share one private sphere check so they report the same way.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is defaulted or repaired; an omitted `parentRig` is refused because `null` is the stated way to say there is no rig.

## @evidence contracts/development/common.md#meaningful-documentation

States the accepted shape, units and bounds, why values are read as unknown, the reported paths, and where checking stops.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed number of field checks in constant time, with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Checks one camera's envelope per call and coordinates no work across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing itself; it appends at most four violations per call to `out`, a centre and a radius for each sphere, to the collector the caller owns.
