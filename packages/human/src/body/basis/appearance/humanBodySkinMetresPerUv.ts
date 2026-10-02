import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";

/**
 * The area-weighted median length, in metres of the neutral skin, of one unit
 * of the UV layout over a material's regions: per triangle, the square root of
 * its surface area over its UV area, and the ratio below which half of the
 * material's surface area lies. A layout packs regions at different
 * densities, so a detail tiled at one scale over it is right at that ratio and
 * within the layout's own spread elsewhere (a body's shin, neck and chest
 * differ by tens of percent, so the spread is the unresolved part). The
 * weighting is by surface area because a viewer sees area: the count of
 * triangles over-weights the hands, feet and face, whose triangles are many
 * and small. A material none of whose triangles has a UV area is refused.
 */
export function humanBodySkinMetresPerUv(
  basis: IAutoMovieHumanBodyBasis,
  material: string,
): number {
  const ratios: { ratio: number; area: number }[] = [];
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
        if (uvArea > 0 && area > 0)
          ratios.push({ ratio: Math.sqrt(area / uvArea), area });
      }
    }
  }
  if (ratios.length === 0)
    throw new Error("A skin detail needs the skin material's UV layout.");
  ratios.sort((x, y) => x.ratio - y.ratio);
  const half = ratios.reduce((sum, { area }) => sum + area, 0) / 2;
  let seen = 0;
  let chosen = ratios[0].ratio;
  for (const { ratio, area } of ratios) {
    seen += area;
    chosen = ratio;
    if (seen >= half) break;
  }
  return chosen;
}
