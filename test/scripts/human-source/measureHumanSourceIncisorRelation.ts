import { readHumanFaceOralCrowns } from "@automovie/human/face/anatomy/oral/readHumanFaceOralCrowns";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceIncisorRelation } from "./structures/IHumanSourceIncisorRelation.ts";

/**
 * Read the source's central-incisor extrema in one caller-owned oral frame.
 *
 * The upper incisal extreme is farthest toward the mandible and the lower
 * extreme toward the maxilla; their projected lap is overbite. Their most
 * anterior projections differ by overjet. The source has no measured cusp or
 * clinical acquisition protocol, so these are geometric source relations.
 * A frozen frame makes a rigid lower translation affine in both readings.
 */
export function measureHumanSourceIncisorRelation(
  face: IAutoMovieHumanFaceBasis,
  positions: readonly number[],
  occlusalDirection: readonly number[],
  forward: readonly number[],
): IHumanSourceIncisorRelation {
  const crowns = readHumanFaceOralCrowns(face);
  const upper = crowns
    .filter((crown) => crown.id === "11" || crown.id === "21")
    .flatMap((crown) => crown.vertices);
  const lower = crowns
    .filter((crown) => crown.id === "31" || crown.id === "41")
    .flatMap((crown) => crown.vertices);
  if (upper.length === 0 || lower.length === 0)
    throw new Error(
      "Source incisor relation needs both central-incisor pairs.",
    );
  const project = (vertex: number, axis: readonly number[]): number =>
    [0, 1, 2].reduce(
      (sum, at) => sum + positions[3 * vertex + at] * axis[at],
      0,
    );
  const upperOcclusal = Math.max(
    ...upper.map((vertex) => project(vertex, occlusalDirection)),
  );
  const lowerOpposite = Math.max(
    ...lower.map((vertex) => -project(vertex, occlusalDirection)),
  );
  const result = {
    overbiteMetres: upperOcclusal + lowerOpposite,
    overjetMetres:
      Math.max(...upper.map((vertex) => project(vertex, forward))) -
      Math.max(...lower.map((vertex) => project(vertex, forward))),
  };
  if (
    !Number.isFinite(result.overbiteMetres) ||
    !Number.isFinite(result.overjetMetres)
  )
    throw new Error(
      "Source incisor relation has nonfinite projected coordinates.",
    );
  return result;
}
