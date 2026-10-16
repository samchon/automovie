/**
 * Shared support distance on both sides of the wrist's measured cut plane.
 *
 * Three percent of the admitted positive hand length is the existing palm collar convention, now consumed by the arm as well. For a regular joined ring, equal opposite translations of that ring cancel axially in the subdivision limit. Independent forearm and hand lengths remain identity measurements; this support distance is a construction convention, not an anatomical tendon length or pigment width.
 *
 * @param handLength Wrist-to-dactylion hand length, millimetres
 * @returns Collar translation along the shared wrist normal, millimetres
 */
export function measureAutoMovieHumanWristCollar(handLength: number): number {
  return 0.03 * handLength;
}
