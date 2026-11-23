# src/scene/buildFluidSurfaceObject.ts#buildFluidSurfaceObject

## @evidence contracts/development/implementation.md#principled-implementation

The admitted engine surface supplies indexed positions, normals, UVs, flow and wet bounds; uploads copy them to Float32 attributes and use the wet-bound box diagonal for a conservative sphere. A different domain refuses before writes; buffer consistency and finite values are engine admission premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One mesh owns upload and resource release while the fluid solver remains numerical. Flow and mode are metadata for custom materials, not a second viewer velocity computation or an implicit ripple shader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Dry lattice vertices do not enlarge the supplied wet-bound sphere. The translucent blue default is an authored display choice rather than a physical appearance claim. Construction and mid-upload failures lack full rollback; disposal attempts each owned resource independently without consumer exceptions.

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes uploaded flow from material consumption and Float32 projection from numerical depth. Props state borrowed material ownership and the metadata-only role of mode.

## @evidence contracts/development/implementation.md#efficient-algorithms

Upload copies vertex, normal, UV, flow and index arrays with linear time and space in their lengths; wet-bound sphere construction is constant work. A full upload is needed because this API accepts a complete new surface rather than dirty ranges.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Mesh, geometry identity and material persist across updates; attributes are recreated for each supplied surface. Domain guards identity but does not prove that equal step values imply unchanged bytes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns scene attachment and disposal; geometry and only the default material belong to this object. Each invocation independently attempts geometry then the default material; ordered causes follow the existing reporter, including its unresolved diagnostic-coercion limit. Repeat and post-disposal update behavior remains unchanged. Latest attributes replace old references, while constructor rollback and physical GPU retirement are unproven. Maintained callers are owning tests rather than a production fluid scene host.
