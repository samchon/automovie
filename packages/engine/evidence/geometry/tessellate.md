# src/geometry/tessellate.ts#tessellate

## @evidence contracts/development/implementation.md#principled-implementation

Box faces use independent flat-normal corners, spheres sample latitude and longitude, capsules split the sphere equator into two rings separated by the body height, and cylinders and cones use radial rings with slope-correct normals and cap fans. Validated dimensions and representable derived arithmetic are premises; finite scalar admission does not establish the latter. Sphere and capsule poles and cone apexes retain degenerate lattice faces.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One discriminator dispatches to private primitive builders shared by viewer geometry, model extents, drawing and GLB export; fixed angular resolution keeps the lightweight render deterministic without adding authoring options.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Each primitive uses its declared solid geometry; the capsule's body height separates its hemisphere centres without substituting a bounding cylinder or adapting to a consumer or expected volume.

## @evidence contracts/development/common.md#meaningful-documentation

States local metre coordinates, winding, prior dimension validation, fixed sampling counts, zero-height plane topology, fresh output ownership and the capsule's hemisphere and body construction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Box construction is constant size, radial primitives use O(S) positions and indices for S angular segments, and spheres and capsules use O(S times R) for R latitude rings, with one additional capsule equator ring; both resolution values are fixed here and each output element is emitted once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Callers receive mutable fresh buffers, so the tessellator shares no arrays across calls; consumers such as the drawing index own any model-part memoization.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The builders retain no cache, handle or task; positions, normals and indices belong to the returned tessellation and temporary face tables are released on return.
