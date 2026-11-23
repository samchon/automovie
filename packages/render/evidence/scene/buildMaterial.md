# src/scene/buildMaterial.ts#buildMaterial

## @evidence contracts/development/implementation.md#principled-implementation

Maps admitted linear PBR coefficients/alpha policy and the glTF anisotropy, sheen, specular and volume parameters (degrees to radians, a declared sheen at intensity one) into MeshPhysicalMaterial and resolves binding-private textures with explicit color-space roles; glTF combined metallic-roughness uses one shared binding, while subsurface/procedural/detail/overlay shader features follow their actual producer conventions rather than claiming a measured full spectral material model.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns material field realization and delegates sampler admission plus feature-specific shader injection to their existing owners; optional omission yields documented scalar/default behavior without a second material representation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses authored coefficients and contract defaults (mask cutoff0.5, ior1.5, specular intensity 1, isotropic and sheen-free lobes, neutral overlay factors), not expected-frame textures; no resolver/global method is replaced, and unresolved optional maps produce scalar material rather than pretending an image was decoded.

## @evidence contracts/development/common.md#meaningful-documentation

Documents name/id identity, new-material ownership, separate texture/shared-table lifetime and failure preservation; individual texture roles and detail-only normal fallback are explicit in their owning helpers/comments.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs fixed PBR/binding setup plus O(K) authored overlay resolution and feature source initialization; material storage grows with active texture/overlay bindings, not mesh vertices or instance population, and combined metallic/roughness reuses one resolved texture.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Resolves the shared metallic-roughness binding once and borrows primed texture-cache bindings, while model/library owners share equivalent material variants across parts/surfaces; this producer creates one independent material per request.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Registers its new material before binding/shader setup and retires it on failure; successful material transfers to caller, whereas resolver texture wrappers and shader tables stay with their owning cache/producer. Material references retain borrowed bindings until the material/owner becomes unreachable.
