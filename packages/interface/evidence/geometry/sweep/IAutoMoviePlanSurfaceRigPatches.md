# src/geometry/sweep/IAutoMoviePlanSurfaceRigPatches.ts#IAutoMoviePlanSurfaceRigPatches

## @evidence contracts/development/common.md#meaningful-documentation

Patch counts and identity keys bind ordered metre samples into one mutable network registry. Shared identity comes from declared keys, not coordinate proximity; failed registration can leave partial state that the construction owner discards.

## @evidence contracts/development/design.md#principled-representation

Patch counts and identity keys bind ordered metre samples into one mutable network registry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

planAutoMovieSurfaceRigPatches uses the owning rig's count, sample, loop and sweep resolvers during tier construction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shared identity comes from declared keys, not coordinate proximity; failed registration can leave partial state that the construction owner discards.

# src/geometry/sweep/IAutoMoviePlanSurfaceRigPatches.ts#IAutoMoviePlanSurfaceRigPatches.IProps

## @evidence contracts/development/design.md#principled-representation

Named edges and dimensionless sweep coordinates preserve welding identity; the tier-count callback admits counts while planning checks patch ranges, loop compatibility and positive tension.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSurfaceNetwork supplies its shared registry, rig lookup and edge samplers so patch planning does not create independent sweep or node caches.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Samples are welded by declared identities; bridge probes bind after cell resolution and use the same geometric field as their endpoints.

## @evidence contracts/development/common.md#meaningful-documentation

Describes mutable registry effects, callback responsibilities, exception propagation and the deferred probe-registration phase.
