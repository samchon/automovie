# src/drawing/autoMovieBoundaryShellTriangles.ts#autoMovieBoundaryShellTriangles

## @evidence contracts/development/implementation.md#principled-implementation

An extrusion of the planar outline along local `+Z` by `thickness`: the outline is reordered counter-clockwise by the sign of its shoelace area so the quads and the far cap face outward and the near cap is reversed, and the caps come from ear clipping, which needs the simple outline that validation already guarantees for a face.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function turns one face record into a closed triangle soup and delegates placement to `autoMovieBoundaryFacePoint` and cap tessellation to `triangulateAutoMoviePolygon`, so the drafter treats a face-only boundary exactly like an element mesh.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No face, kind or thickness is special-cased; the winding is normalized from the outline's own area sign instead of trusting the authoring order, and a malformed outline is refused by the triangulator rather than drawn as a partial solid.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the slab reading, why both caps are closed, why caps are ear-clipped, the outward winding the silhouette pass relies on, the throwing precondition and the triangle count.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the corner count `n` for placing `2n` corners and `2n` side triangles; the dominant cost is the cap triangulation, which is quadratic in `n` and runs once for both caps because they share one index list.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one face; the drafter calls it once per face-only boundary per derivation, so there is no repeated request to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array owned by the caller and keeps no state, handle or task after returning.
