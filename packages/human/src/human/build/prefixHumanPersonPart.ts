import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

/**
 * Put the supplied mesh in a face/body part wrapper, prefixing its ID, name and material identity with that owner.
 *
 * Face and body parts share IDs such as `skin`, so the person model names each after its owner (`face:skin`, `body:skin`). This changes addressing only; the supplied mesh is borrowed and no geometry is copied or moved.
 *
 * @evidence contracts/common.md#principled-implementation Explicit face/body ownership rebases part and material addresses while retaining the supplied mesh and other part properties.
 * @evidence contracts/common.md#clear-and-simple-design One wrapper owns namespacing; callers own placement, mesh admission and the correspondingly prefixed palette.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prefixing establishes no source registration or material availability; the caller supplies the actual placed mesh and palette owner.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes addressing from geometry movement and states borrowed mesh ownership.
 * @evidence contracts/performance.md#efficient-algorithms One shallow wrapper copy and three prefix concatenations cost the actual property/string sizes, independent of mesh vertex count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Distinct owner/part/mesh wrappers are composed once here, without a part cache or request coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned wrapper retains the supplied mesh and copied property references until the caller releases it; no independent task or resource is acquired.
 */
export function prefixHumanPersonPart(
  owner: "face" | "body",
  part: IAutoMovieModel["parts"][number],
  mesh: IAutoMovieMesh,
): IAutoMovieModel["parts"][number] {
  return {
    ...part,
    id: owner + ":" + part.id,
    name: owner + ":" + part.name,
    material: owner + ":" + part.material,
    geometry: { type: "mesh", mesh },
  };
}
