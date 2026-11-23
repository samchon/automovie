# src/service/appendServiceSleeveOnFace.ts#appendServiceSleeveOnFace

## @evidence contracts/development/implementation.md#principled-implementation

Inverse rigid face rotation places a finite sleeve centre in boundary coordinates, where thickness and a conservative radius-bounding square must fit the boundary and optional opening outline.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Boundary geometry, Quaternion and shared polygonInside own frame conversion and inclusion, so service sleeves follow the same planar fit convention as architecture openings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Absent faces remain unsupported geometry rather than invented walls; malformed radius/position skips secondary fit accusations, and square bounds explicitly err toward refusing corner fits.

## @evidence contracts/development/common.md#meaningful-documentation

States centre/thickness checks, square-versus-circle conservatism, opening-specific fit and absent-face behavior without claiming actual construction waterproofing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Boundary/opening resolution is linear in their tables; four square corners undergo shared polygon inclusion whose work depends on outline population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One local centre and bounding square serve both boundary and opening checks; no face result is cached across geometric edits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local offset, inverse rotation, centre and corners release on return, while only ordered violations remain on the caller's collector.
