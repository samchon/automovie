# src/scene/buildModel.ts#buildModel

## @evidence contracts/development/implementation.md#principled-implementation

Builds admitted semantic bone rest TR and part TRS, binds skin joints or rigid attached bones, selects linear or dual quaternion skinning per skin through the material shader patch and matching shadow materials, realizes geometry/PBR through their canonical owners and derives vertex tangents only for anisotropic rigid, morph-free, normal-map-free indexed normal/UV geometry. Nonfinite/zero derived axes discard the new attribute; mapped/deforming or unsupported geometry retains its existing derivative-frame limitations. Consistent source normals remain a premise; this is not a MikkTSpace bake guarantee. AttachedBone intentionally takes precedence over skin, bone rest scale is unit by engine convention and complete finite/unique hierarchy/material admission remains upstream.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns one model graph plus semantic bone/part registries, one skeleton per ordered joint list, material variants by definition id with vertex-color/relief/skinning-method flags (a worn definition takes one material per part, since its edge texture belongs to that geometry) and one patched shadow pair per dual quaternion mesh; geometry, physical-vertex mapping, material shading and imported appearances remain separate producers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing referenced skin/attached bones throw rather than producing frozen geometry; missing material definitions currently select the ordinary default material, so this producer is not a substitute for complete source admission. No anatomical fixture names, patched Three methods or extra UV channels choose output.

## @evidence contracts/development/common.md#meaningful-documentation

Documents rigid-versus-skin precedence, ordered-joint skeleton sharing with per-mesh bind state, the dual quaternion material and shadow variants, morph target naming and the driven-target record, bone lookup, texture resolver/binding-private ownership, first-acquisition rollback and result transfer; comments give the shared engine unit bone-scale convention.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds B bones and P parts with id maps, updates the rest hierarchy once, allocates one skeleton per unique ordered joint list and updates only each newly attached skin's own world matrix before explicit binding. Joint-key construction costs O(J) per skin with J palette slots; inverse and GPU matrix storage costs O(sum of unique palette lengths), without a growing graph traversal per part. One geometry per part, one material per encountered definition/colored/weighted/skinning-method variant and two shadow materials per dual quaternion skin remain. Typed buffer work scales with vertices/indices; eligible anisotropic geometry adds one O(V+I) tangent pass, an owned four-component attribute and O(V) temporary accumulation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares skeletons only inside this build when ordered joint identifiers match, because those slots resolve to the same Bone objects and unchanged rest-world inverse matrices; per-mesh bind matrices and blend methods stay independent. Shares material variants across matching part flags and borrows primed texture bindings; separate builds own independent bone/part graphs and skeletons because pose state cannot be shared across placements.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Registers created geometry/material/shadow material/skeleton immediately within construction rollback and transfers the complete model graph/registries on success; resolver textures stay externally owned. A worn part's edge texture is read only through its own material's program, so it is released by that material's `dispose` event. The returned record provides no universal disposer, so its scene/runtime owner must enumerate physical resources including skin skeleton state when retiring it.
