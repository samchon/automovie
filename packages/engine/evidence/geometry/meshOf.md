# src/geometry/meshOf.ts#meshOf

## @evidence contracts/development/implementation.md#principled-implementation

Area-weighted vertex normals: the cross product of two edges has length twice the triangle's area and points by its winding, so summing them before one normalization is the standard area-weighted average, and `Vector3.normalize` keeps direction for extreme magnitudes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The extruder, revolver and sweep share this one wrapper, and the seam groups are an explicit input from the builder that created the duplicate vertices rather than a weld this function would have to guess.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Seam vertices are not welded by position, which would merge creases that must stay sharp; only the builder's declared groups are pooled, and unused vertices keep a zero normal instead of an invented direction.

## @evidence contracts/development/common.md#meaningful-documentation

States the weighting, what groups mean, the unused-vertex result, that the arrays are adopted rather than copied, and that indices are trusted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in triangles, grouped vertices and vertices: one accumulation pass with scalar cross products, one pass per group, and one normalization per vertex.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each builder call produces one new mesh, and its normals depend on that call's positions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one normals array the size of `positions` and adopts the caller's arrays into the returned mesh without copying.
