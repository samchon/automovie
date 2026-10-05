import type { IHumanSourceSkinLandmarkSource } from "./structures/IHumanSourceSkinLandmarkSource.ts";

/**
 * The named skin points the body view carries, each with the vertex it is
 * read from and why that vertex is the point.
 *
 * - `nipple-left`: the centre of the left nipple-areola fill. The published
 *   body (r16) placed its bust level and bra on vertex 21898, which is that
 *   centre; the view takes its exact twin.
 * - `neck-anterior-midline`: the front midline vertex of MakeHuman's
 *   neck-circumference ruler ring (`plugins/0_modeling_a_measurement.py`,
 *   measure-neck-circ), base-mesh vertex 803, which the subdivided skin keeps
 *   as source sample 803.
 */
export const HUMAN_SOURCE_SKIN_LANDMARKS: readonly IHumanSourceSkinLandmarkSource[] = [
  { name: "nipple-left", from: { kind: "published-body-vertex", vertex: 21898 } },
  { name: "neck-anterior-midline", from: { kind: "source-sample", sample: 803 } },
];
