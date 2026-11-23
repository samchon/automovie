# src/geometry/tessellateToMesh.ts#tessellateToMesh

## @evidence contracts/development/implementation.md#principled-implementation

A field-for-field lift of the tessellation into the mesh record: positions, normals and indices pass through unchanged and the two attributes a primitive does not define are `null`, so geometry and winding are exactly `tessellate`'s.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A thin adapter kept separate from `tessellate` because most callers want the leaner always-indexed `ITessellation`, while placement and merge operate on `IAutoMovieMesh`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No placeholder UVs or identity skin are invented to fill the record; absence is stated with `null`.

## @evidence contracts/development/common.md#meaningful-documentation

States what the mesh carries and why UVs and skin are absent, where it is used, the ownership of the result and the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work over `tessellate`'s fixed-size output: the arrays are handed over, not copied.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Callers may mutate the returned arrays, so each call returns fresh ones and nothing is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the three arrays from `tessellate` are transferred to the returned mesh.
