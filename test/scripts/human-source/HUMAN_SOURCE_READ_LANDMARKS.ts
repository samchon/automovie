import type { IHumanSourceReadLandmark } from "./structures/IHumanSourceReadLandmark.ts";

/**
 * Head landmarks whose defining structure is modelled in the skin but has no
 * coordinate rule a vertex search could apply, so the region's owner chose
 * the vertex by reading rendered frames of the neutral person. Sided names
 * are read on the right; the left is the exact mirror twin. Each entry keeps
 * the compared neighbours, the reading's ambiguity and the frames it was made
 * on; the meaning and citation are in `HUMAN_SOURCE_HEAD_LANDMARK_TEXTS`.
 *
 * - `tragion-right`: the uppermost vertex of the anterior juncture of the
 *   tragus ridge with the cheek skin. The fully moved region of MPFB's ear
 *   translation target reaches onto the cheek, so its boundary is not used.
 * - `subnasale`: the corner where the midline profile turns from the
 *   columella slope into the upper lip's vertical part; the upper end of the
 *   bend was taken, 5072 lying 2.3 mm lower at the same depth.
 * - `alar-curvature-right`: the most posterior point of the alar mass
 *   boundary on the normal pass.
 * - `subalare-right`: the lowest point where the alar boundary meets the
 *   upper lip.
 * - `otobasion-superius-right`: the highest vertex of the read ear
 *   attachment loop, where the helix's anterior upper rim joins the scalp.
 * - `otobasion-inferius-right`: the lowest point of the notch where the lobe's
 *   lower edge meets the cheek, on the attachment loop.
 */
export const HUMAN_SOURCE_READ_LANDMARKS: Readonly<
  Record<string, IHumanSourceReadLandmark>
> = {
  "tragion-right": {
    vertex: 5477,
    neighbours: [5699, 5610],
    ambiguityMetres: 0.0004,
    frames:
      "right ear of the neutral generation person: side, front and three-quarter, normal and clay, candidates marked",
  },
  subnasale: {
    vertex: 343,
    neighbours: [5072, 317],
    ambiguityMetres: 0.0023,
    frames: "neutral person nose, side clay with midline candidates marked",
  },
  "alar-curvature-right": {
    vertex: 5051,
    neighbours: [5139, 288],
    ambiguityMetres: 0.0015,
    frames:
      "neutral person nose, front three-quarter normal and side clay with alar groove candidates marked",
  },
  "subalare-right": {
    vertex: 358,
    neighbours: [286, 288],
    ambiguityMetres: 0.0015,
    frames:
      "neutral person nose, front three-quarter normal with alar groove candidates marked",
  },
  "otobasion-superius-right": {
    vertex: 5767,
    neighbours: [5755, 5756],
    ambiguityMetres: 0.001,
    frames:
      "neutral person right ear, side and front three-quarter clay with attachment loop candidates marked",
  },
  "otobasion-inferius-right": {
    vertex: 5761,
    neighbours: [5768, 5752],
    ambiguityMetres: 0.001,
    frames:
      "neutral person right ear, front three-quarter clay with attachment loop candidates marked",
  },
};
