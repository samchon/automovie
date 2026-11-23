# src/geometry/stepSubdivisionRing.ts#stepSubdivisionRing

## @evidence contracts/development/implementation.md#principled-implementation

Catmull-Clark's face, edge and vertex rules restricted to the faces around one vertex, which contain every point the child's one-ring is made of; this makes semi-sharp sharpness that outlasts the requested level exact in the limit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuses the shared vertex mask, edge smoothness and decay rules, so the ring ages a crease exactly as a full level does.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No approximation of the sharp-to-smooth transition; the ring is refined until its sharpness is spent.

## @evidence contracts/development/common.md#meaningful-documentation

States the three child point kinds and why the ring refines on its own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the valence: one pass each for diagonals, edges and the centre.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each step consumes the previous ring; nothing is shared across vertices.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a ring of the same size and retains nothing.
