# src/scene/applyEdgeMode.ts#applyEdgeMode

## @evidence contracts/development/implementation.md#principled-implementation

Uses the inverted-hull method: back-face white extrusion plus black front fill, native or dual-quaternion skinning/instancing and optional shared cycle deformation; finite nonnegative width, usable normals and ordinary mesh surface behavior are premises, with model-space extrusion distorted by nonuniform object scale and transparent/open geometry limitations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns contour shell placement/materials and delegates black fill substitution to the shared reversible override helper; shallow clones borrow geometry/skeleton and preserve local transforms beside each source mesh.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Derives contours from actual geometry/normals rather than fixture outlines or image postprocess; EDGE_SHELL_NAME identifies owned temporary shells only, and no foreign clone/dispose implementation is substituted.

## @evidence contracts/development/common.md#meaningful-documentation

Explains inverted hull, black fill/background, supported skinning, extrusion units/scaling, clipping by a plane given to the materials, what an update refreshes on a shell and what it does not follow, and returned shell/material restoration scope.

## @evidence contracts/development/implementation.md#efficient-algorithms

Collects M meshes and adds M shallow shells while allocating C cycle- and skinning-method-equivalent shell materials; CPU/temporary references are O(M+C), extra raster cost is one hull draw per mesh, and borrowed vertex buffers are not duplicated. An update copies M local transforms plus the morph influences and instance matrices those meshes hold.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares one shell shader material per actual cycle identity and skinning method plus one static material; geometry/skeleton are borrowed from shallow clones, and an update reuses the shells and materials built at application, while independent pass installs cannot share mutable restoration state.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns shells/shell materials and borrowed original fill/background references until memoized restore; restoration attempts independent removals/disposals, preserving original geometry/skeleton. Mid-install clone/material failure has no outer rollback and remains an acquisition-failure gap.
