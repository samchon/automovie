# src/geometry/revolveAutoMovieProfile.ts#revolveAutoMovieProfile

## @evidence contracts/development/implementation.md#principled-implementation

A surface of revolution sampled on a regular `theta` lattice with an explicit duplicate seam ring, smooth normals from area-weighted face normals merged across the seam and each pole ring by `meshOf`'s normal groups, and an atlas of `(2 * pi - theta) * r` against cumulative meridian length, whose equiareal shear is derived above; poles collapse to zero-area triangles that the topology report counts, and the remaining limitation is that shear, which no choice of `u` offset can remove.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, lattice, index strip and normal groups sit in one function because each depends on the same profile count and segment count; normal accumulation and buffer assembly are delegated to the shared `meshOf`, and admission to the shared `countAtLeast` and `finitePoint` guards.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The meridian is never hulled, closed, reordered or deduplicated, and a pole is not welded; the seam keeps its true UV cut rather than a stretched finish, and normal groups only share lighting across vertices that are the same physical point.

## @evidence contracts/development/common.md#meaningful-documentation

States the profile axes and unit, closure and pole behaviour, the atlas formula and its handedness, the seam and shear limits with measured anisotropy, which builders to use instead for a directional finish, and each parameter's domain, the output counts and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P profile points and S segments, the lattice, indices and normal pass are each O(S * P) with one cosine and sine per segment; the pole groups add S + 1 entries per axis point, and output size is the floor.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one requested mesh whose buffers the caller owns, so nothing is cached between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the meridian lengths and normal groups are released on return, and the position, UV, index and normal arrays are transferred to the returned mesh, sized by S * P.
