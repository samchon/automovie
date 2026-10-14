import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";

/**
 * The area-weighted median length, in metres of the neutral skin, of one unit of the UV layout over a material's regions: per triangle, the square root of its surface area over its UV area, and the ratio below which half of the material's surface area lies. A layout packs regions at different densities, so a detail tiled at one scale over it is right at that ratio and within the layout's own spread elsewhere; local variation remains unresolved. The weighting is by surface area because a viewer sees area: the count of triangles over-weights the hands, feet and face, whose triangles are many and small. A material none of whose triangles has a UV area is refused.
 *
 * @evidence contracts/common.md#principled-implementation Each usable neutral-surface triangle contributes sqrt(surface area / UV area), and sorting with physical-area weights selects the material's weighted median metre scale.
 * @evidence contracts/common.md#clear-and-simple-design A single triangle traversal builds ratio/area records and a cumulative median pass returns one scalar for the texture binding owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Untextured or degenerate-area triangles contribute no ratio and an empty usable set refuses; the one median does not correct local UV stretch or establish a measured body-site spread.
 * @evidence contracts/common.md#meaningful-documentation Metre units, neutral geometry, physical-area weighting, refusal and the unresolved local variation are explicit.
 * @evidence contracts/performance.md#efficient-algorithms For T addressed triangles, collection and median walking cost O(T), sorting costs O(T log T), and the ratio records use O(T) temporary memory.
 * @evidence contracts/performance.md#reuse-equivalent-work This utility owns no cache; basis-scoped detail and tone builders retain its result when their immutable basis/material request repeats.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the chosen number escapes; triangle edge arrays and ratio records become unreachable on return, with no external handles or asynchronous work.
 */
export function humanBodySkinMetresPerUv(
  basis: IAutoMovieHumanBodyBasis,
  material: string,
): number {
  const ratios: { ratio: number; area: number }[] = [];
  for (const surface of basis.surfaces) {
    const p: number[] = surface.positions;
    for (const region of surface.regions) {
      if (region.material !== material || region.uvs === null) continue;
      for (let t: number = 0; t < region.indices.length; t += 3) {
        const [a, b, c]: number[] = [0, 1, 2].map(
          (k: number): number => region.indices[t + k],
        );
        const e1: number[] = [0, 1, 2].map(
          (k: number): number => p[b * 3 + k] - p[a * 3 + k],
        );
        const e2: number[] = [0, 1, 2].map(
          (k: number): number => p[c * 3 + k] - p[a * 3 + k],
        );
        const area: number =
          Math.hypot(
            e1[1] * e2[2] - e1[2] * e2[1],
            e1[2] * e2[0] - e1[0] * e2[2],
            e1[0] * e2[1] - e1[1] * e2[0],
          ) / 2;
        const uv: number[] = region.uvs;
        const u1: number[] = [
          uv[(t + 1) * 2] - uv[t * 2],
          uv[(t + 1) * 2 + 1] - uv[t * 2 + 1],
        ];
        const u2: number[] = [
          uv[(t + 2) * 2] - uv[t * 2],
          uv[(t + 2) * 2 + 1] - uv[t * 2 + 1],
        ];
        const uvArea: number = Math.abs(u1[0] * u2[1] - u1[1] * u2[0]) / 2;
        if (uvArea > 0 && area > 0)
          ratios.push({ ratio: Math.sqrt(area / uvArea), area });
      }
    }
  }
  if (ratios.length === 0)
    throw new Error("A skin detail needs the skin material's UV layout.");
  ratios.sort(
    (
      x: { ratio: number; area: number },
      y: { ratio: number; area: number },
    ): number => x.ratio - y.ratio,
  );
  const half: number =
    ratios.reduce(
      (sum: number, { area }: { ratio: number; area: number }): number =>
        sum + area,
      0,
    ) / 2;
  let seen: number = 0;
  let chosen: number = ratios[0].ratio;
  for (const { ratio, area } of ratios) {
    seen += area;
    chosen = ratio;
    if (seen >= half) break;
  }
  return chosen;
}
