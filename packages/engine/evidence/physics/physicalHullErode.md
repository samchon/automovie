# src/physics/physicalHullErode.ts#physicalHullErode

## @evidence contracts/development/common.md#meaningful-documentation

States the erosion as moved half-spaces, how vertices are found, the premise on the depth and the frame.

## @evidence contracts/development/implementation.md#principled-implementation

Erosion of a convex polytope by a ball is the intersection of its half-spaces moved inward by the radius; vertex enumeration of that intersection takes each plane triple's unique point and keeps the feasible ones.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns only the erosion: faces come from `physicalHullFaces`, and the result is a point set any hull consumer reads, so a compliant shape's rigid core is one more hull.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Parallel triples are refused by a determinant below 1e-12, dimensionless because the normals are units; feasibility uses the hull's own coplanarity tolerance. The non-null assertions index the face list by bounded indices.

## @evidence contracts/development/implementation.md#efficient-algorithms

Quartic in the face count, a few dozen faces, once per compliant hull when a world is bound.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per compliant hull collider at binding; nothing repeats it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps nothing between calls; its temporaries die with the call.
