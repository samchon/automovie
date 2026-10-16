/**
 * Shared support distance on both sides of the minimum ankle cut.
 *
 * The existing foot convention, 2.5 percent of admitted positive foot length, now also places the leg's opposite collar. For a regular joined ring, equal opposite translations of that section preserve its cut plane on the subdivision limit. This is a construction support span, not a measured tendon length.
 *
 * @param footLength Heel-to-longest-toe foot length, millimetres
 * @returns Collar distance along the shared cut normal, millimetres
 */
export function measureAutoMovieHumanAnkleCollar(footLength: number): number {
  return 0.025 * footLength;
}
