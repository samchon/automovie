import type { IHumanSourceReadLandmark } from "./structures/IHumanSourceReadLandmark.ts";

/**
 * Head landmarks whose defining structure is modelled in the skin but has no
 * coordinate rule a vertex search could apply, so the vertex was chosen by
 * reading rendered frames of the neutral person.
 *
 * - `tragion-right`: the uppermost vertex of the anterior juncture of the
 *   tragus ridge (the cartilage plate in front of the ear canal) with the
 *   cheek skin, read on side, front and three-quarter normal and clay frames
 *   of the right ear with candidate vertices marked. 5699 (the ridge crest)
 *   lies 0.4 mm lower; 5610 is the next juncture vertex. The fully moved
 *   region of MPFB's ear translation target reaches onto the cheek, so its
 *   boundary is not the anatomical juncture and is not used.
 */
export const HUMAN_SOURCE_READ_LANDMARKS: Readonly<Record<string, IHumanSourceReadLandmark>> = {
  "tragion-right": {
    vertex: 5477,
    neighbours: [5699, 5610],
    ambiguityMetres: 0.0004,
    frames: "right ear of the neutral generation person: side, front and three-quarter, normal and clay, candidates marked",
  },
};
