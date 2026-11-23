# src/analysis/autoMovieSolidBlocks.ts#autoMovieSolidBlocks

## @evidence contracts/development/implementation.md#principled-implementation

Cyrus-Beck clipping narrows the parametric interval [0,maxDistance] against every half-space and exits when it empties. Unit direction makes the parameter metres; the 1e-12 normal-relative parallel band approximates near-parallel crossings, and raw dot products and norm scaling can overflow at extreme finite magnitudes, so scale invariance relies on representable intermediate arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function answers one solid; the union over solids belongs to `autoMovieRayObstructed`, and the inside convention matches the one `validateSolidPlanes` documents.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same normal-relative parallel threshold applies to every plane. Treating the band as parallel can omit a real crossing, including a nearby one when the origin is near the face; it is a declared approximation rather than an exact clipping guarantee.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the slab method, the inside convention, the start-inside and on-face outcomes, scale invariance of both the parameter and the parallel test, and the parallel band; each property states its unit or meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the P planes, O(P), with two dot products and one normal length each and no allocation, returning early on a separating parallel plane or an emptied interval.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call tests one ray against one solid; rays differ in origin or direction, so there is no equivalent result to share, and the caller decides how often it runs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps only the entry and exit parameters as locals while scanning the caller's planes, holding no reference after it returns.
