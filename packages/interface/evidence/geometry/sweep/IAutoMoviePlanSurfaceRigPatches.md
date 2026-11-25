# src/geometry/sweep/IAutoMoviePlanSurfaceRigPatches.ts#IAutoMoviePlanSurfaceRigPatches.IProps

## @evidence contracts/development/design.md#principled-representation

Named edges and dimensionless sweep coordinates preserve welding identity; the tier-count callback admits counts while planning checks patch ranges, loop compatibility and positive tension.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSurfaceNetwork supplies its shared registry, rig lookup and edge samplers so patch planning does not create independent sweep or node caches.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Samples are welded by declared identities; bridge probes bind after cell resolution and use the same geometric field as their endpoints.

## @evidence contracts/development/common.md#meaningful-documentation

Describes mutable registry effects, callback responsibilities, exception propagation and the deferred probe-registration phase.
