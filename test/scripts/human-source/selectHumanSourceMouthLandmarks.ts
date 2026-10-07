import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import { pickHumanSourceExtremum } from "./pickHumanSourceExtremum.ts";
import type { IHumanSourceLandmarkPick } from "./structures/IHumanSourceLandmarkPick.ts";

/** Half-width of the midline band, metres (the mouth owner's rule). */
const MIDLINE_METRES = 0.0006;
/** Off-midline band of the Cupid's-bow peaks, metres. */
const PHILTRUM_BAND: readonly [number, number] = [0.002, 0.012];

/**
 * The mouth landmarks defined by rule on the face's lips and skin regions, by
 * the mouth owner's rules. The vermilion border is every vertex shared by a
 * lips triangle and a skin triangle (it includes the inner mucosal border, so
 * "outer" is the most anterior). Above and below the fissure are read against
 * the central contact pair's heights.
 *
 * - labiale-superius / labiale-inferius: the most anterior midline border
 *   vertex above the upper / below the lower central contact vertex;
 * - cheilion-left / -right: the lateral-most lips vertex on each side (+X is
 *   the face's left);
 * - crista-philtri-left / -right: the highest upper-border vertex 2 to 12 mm
 *   off the midline on each side;
 * - stomion: the central contact pair's upper vertex.
 *
 * A tie at an extremum refuses by name.
 */
export function selectHumanSourceMouthLandmarks(
  face: IAutoMovieHumanFaceBasis,
  positions: readonly number[],
): Record<string, IHumanSourceLandmarkPick> {
  const contact = face.contact;
  if (contact === undefined)
    throw new Error("Mouth landmarks: the face has no contact.");
  const surface = face.surfaces.find((s) => s.id === contact.lips.surface);
  const lips = surface?.regions.find((r) => r.id.endsWith("/lips"));
  const skin = surface?.regions.find((r) => r.id.endsWith("/skin"));
  if (surface === undefined || lips === undefined || skin === undefined)
    throw new Error(
      "Mouth landmarks: the lips surface has no lips and skin regions.",
    );
  const inLips = new Set(lips.indices);
  const border = [...new Set(skin.indices)]
    .filter((v) => inLips.has(v))
    .sort((a, b) => a - b);
  const p = positions;
  const upperY = p[3 * contact.lips.upper + 1];
  const lowerY = p[3 * contact.lips.lower + 1];
  const midline = border.filter((v) => Math.abs(p[3 * v]) < MIDLINE_METRES);
  const upperBorder = border.filter((v) => p[3 * v + 1] > upperY);
  const lipVertices = [...inLips].sort((a, b) => a - b);
  const offMidline = (v: number, side: 1 | -1): boolean =>
    side * p[3 * v] >= PHILTRUM_BAND[0] && side * p[3 * v] <= PHILTRUM_BAND[1];
  const stomion: IHumanSourceLandmarkPick = {
    vertex: contact.lips.upper,
    candidates: [
      {
        vertex: contact.lips.upper,
        position: [0, 1, 2].map((c) => p[3 * contact.lips.upper + c]),
        value: upperY,
      },
    ],
  };
  return {
    "labiale-superius": pickHumanSourceExtremum(
      "labiale-superius",
      p,
      midline.filter((v) => p[3 * v + 1] > upperY),
      2,
      "max",
    ),
    "labiale-inferius": pickHumanSourceExtremum(
      "labiale-inferius",
      p,
      midline.filter((v) => p[3 * v + 1] < lowerY),
      2,
      "max",
    ),
    "cheilion-left": pickHumanSourceExtremum(
      "cheilion-left",
      p,
      lipVertices,
      0,
      "max",
    ),
    "cheilion-right": pickHumanSourceExtremum(
      "cheilion-right",
      p,
      lipVertices,
      0,
      "min",
    ),
    "crista-philtri-left": pickHumanSourceExtremum(
      "crista-philtri-left",
      p,
      upperBorder.filter((v) => offMidline(v, 1)),
      1,
      "max",
    ),
    "crista-philtri-right": pickHumanSourceExtremum(
      "crista-philtri-right",
      p,
      upperBorder.filter((v) => offMidline(v, -1)),
      1,
      "max",
    ),
    stomion,
  };
}
