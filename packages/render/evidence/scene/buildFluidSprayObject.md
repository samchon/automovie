# src/index.ts#buildFluidSprayObject

## @evidence contracts/development/implementation.md#principled-implementation

The engine's admitted capped sample supplies each particle's position, size and age ratio. The builder copies those values to Float32 attributes, computes bounds from positions and hides empty samples; it does not enforce the cap or domain itself.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single Points node projects the sample; particle generation and thinning remain in the engine, while structural passes decide whether points contribute to their documented quantity.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No minimum particle population is fabricated. The fixed color, opacity and 0.05 size are authored default display choices; default normal blending and unused custom attributes do not implement additive or per-particle appearance. Constructor and partial-upload rollback are not provided.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states engine population authority, structural-pass role and the stock material's limitations. Material props identify conditional ownership; count reports the upload length rather than observed visible particles.

## @evidence contracts/development/implementation.md#efficient-algorithms

Upload builds three arrays and Float32 attributes and scans bounds, all linear in particle count. These complete copies match a complete replacement sample rather than a sparse-update protocol.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Points, geometry identity and material persist across updates; each supplied sample rebuilds buffers and bounds. Matching step metadata is not used as a cache key for particle equivalence.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller detaches the node and disposes owned geometry and the optional default material; supplied material stays borrowed. Each invocation independently attempts geometry then default material; ordered causes follow the existing reporter, including its unresolved diagnostic-coercion limit. Disposal remains unmemoized and later updates remain admitted. Engine sampling bounds population but this type imposes no byte cap, and public events are not physical GPU release proof. Maintained callers are tests rather than a production spray scene host.
