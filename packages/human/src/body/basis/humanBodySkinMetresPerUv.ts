import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

/**
 * The median length, in metres of the neutral skin, of one unit of the UV
 * layout over a material's regions: per triangle, the square root of its
 * surface area over its UV area, the median across the triangles that have
 * both. A layout packs regions at different densities, so a detail tiled at
 * one scale over it is right at the median and within the layout's own spread
 * elsewhere. A material none of whose triangles has a UV area is refused.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Reads the physical scale of the shipped UV layout so the skin detail is tiled at its measured size.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Implements the per-triangle area ratio and its median over the material's textured regions.
 */
export function humanBodySkinMetresPerUv(
  basis: IAutoMovieHumanBodyBasis,
  material: string,
): number {
  const ratios: number[] = [];
  for (const surface of basis.surfaces) {
    const p = surface.positions;
    for (const region of surface.regions) {
      if (region.material !== material || region.uvs === null) continue;
      for (let t = 0; t < region.indices.length; t += 3) {
        const [a, b, c] = [0, 1, 2].map((k) => region.indices[t + k]);
        const e1 = [0, 1, 2].map((k) => p[b * 3 + k] - p[a * 3 + k]);
        const e2 = [0, 1, 2].map((k) => p[c * 3 + k] - p[a * 3 + k]);
        const area =
          Math.hypot(
            e1[1] * e2[2] - e1[2] * e2[1],
            e1[2] * e2[0] - e1[0] * e2[2],
            e1[0] * e2[1] - e1[1] * e2[0],
          ) / 2;
        const uv = region.uvs;
        const u1 = [
          uv[(t + 1) * 2] - uv[t * 2],
          uv[(t + 1) * 2 + 1] - uv[t * 2 + 1],
        ];
        const u2 = [
          uv[(t + 2) * 2] - uv[t * 2],
          uv[(t + 2) * 2 + 1] - uv[t * 2 + 1],
        ];
        const uvArea = Math.abs(u1[0] * u2[1] - u1[1] * u2[0]) / 2;
        if (uvArea > 0 && area > 0) ratios.push(Math.sqrt(area / uvArea));
      }
    }
  }
  if (ratios.length === 0)
    throw new Error("A skin detail needs the skin material's UV layout.");
  ratios.sort((x, y) => x - y);
  return ratios[Math.floor(ratios.length / 2)];
}
