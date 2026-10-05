import type { IHumanSourceReadRegion } from "./structures/IHumanSourceReadRegion.ts";

/**
 * Head skin regions whose boundary was read from rendered frames of the
 * neutral person. Only the right side is read; the left is its mirror.
 *
 * - `ear-right`: the ear's attachment loop. The back and upper arc is the
 *   boundary of the vertices all four CC0 ear translation targets move
 *   rigidly; it lies in the scalp-side groove behind the ear and above the
 *   helix root (0.04 to 2.83 mm inside the midpoint of its radial neighbours,
 *   deepest above). The front arc has no groove (radial bends of 169 to 179
 *   degrees), so it runs through tragion, where ANSUR 5.2.42 places the
 *   tragus' juncture with the head; the rigid boundary there lies 10.4 mm
 *   forward on the cheek. Two short bridges join the arcs, below the lobe
 *   front and before the helix root; the lower one zigzags on the frames and
 *   is uncertain by a few millimetres. The seed is the helix top; the outside
 *   vertex is scalp 13.6 mm above the ear top.
 */
export const HUMAN_SOURCE_READ_REGIONS: Readonly<Record<string, IHumanSourceReadRegion>> = {
  "ear-right": {
    loop: [
      5755, 5767, 5756, 5758, 5748, 5760, 5751, 5766, 5747, 5749, 5757, 5770, 5764, 5762, 5753, 5768, 5761, 5752, 5731, 5414, 5436, 5458, 5465, 5456, 5477,
      5468, 5570, 5471, 5470, 5448, 5426, 5738,
    ],
    seed: 5413,
    outside: 860,
    frames: "right ear of the neutral generation person: side, back, front, below and above, clay and normal, loop marked",
  },
};
