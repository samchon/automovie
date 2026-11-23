# src/geometry/mergeAutoMovieMeshes.ts#mergeAutoMovieMeshes

## @evidence contracts/development/implementation.md#principled-implementation

Index rebasing by the running vertex count keeps every member's triangles addressing its own vertices, and the per-attribute rule keeps parallel buffers aligned: an attribute is emitted only if every vertex can be given a true value or the attribute's identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pure concatenation with one admission pass; placement belongs to `transformAutoMovieMesh`, member grouping to `mergeAutoMovieMeshParts`, and physical identity checks to `resolveAutoMovieMeshPhysicalVertices`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing normals or UVs are dropped rather than zero-filled, and misaligned or out-of-range member buffers throw instead of shifting the next member's vertices; elements are appended one by one because a spread into `push` overflows the argument limit on large members.

## @evidence contracts/development/common.md#meaningful-documentation

States that this is not a boolean and what replaces one, each attribute's survival rule and why, the physical-identity rule, ownership, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in total vertices and indices: one admission pass and one append pass per member, plus one hash lookup per physical vertex when any member declares physical sources.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one new mesh from its members; a caller that merges the same members twice can keep the result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns new buffers equal in size to the members' combined buffers plus one physical source table bounded by the distinct declared pairs; the pair lookup map is released on return.
