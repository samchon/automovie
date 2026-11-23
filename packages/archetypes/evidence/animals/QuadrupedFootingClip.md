# src/animals/QuadrupedFootingClip.ts#QuadrupedFootingClip

## @evidence contracts/development/common.md#meaningful-documentation

States the frames, the sampling resolution and the conservative fallback.

## @evidence contracts/development/implementation.md#principled-implementation

A surface point penetrates a plane only where it lies over the plane's extent; the round solids' surfaces are their axis sections swept by the radius.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sample, keep the points over the rectangle, take the least height.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The sampling's resolution is stated; other solids keep the exact conservative test.

## @evidence contracts/development/implementation.md#efficient-algorithms

274 points per round part, and only for a part the global test already flags.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the plane frame and the exact floor reader.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number.
