/**
 * The volume-removing merge of a recess into its base, along one ray of a
 * lofted section (J8 subtractive): the mirror of `AutoMovieHumanSeamUnion`.
 *
 * A recess whose floor stays single-valued along the base's rays (eye socket
 * hollow, philtrum groove, temple hollow, nasolabial and mentolabial sulci,
 * concha floor, popliteal fossa, gluteal and inguinal folds, navel dish) is
 * built in its own frame about its own centre and axis, and reaches the merge
 * as one of two forms:
 *
 * - a depth `d <= 0` under the base along the ray, falling to zero with its
 *   slope and curvature at the edge of its own C2 window (a dent). The merge is
 *   `base + d`: it never raises the base;
 * - the radial distance of the recess's own floor surface along the same ray,
 *   or none (`+Infinity`) where the ray misses the recess's volume. The merge
 *   is the cubic smooth minimum `min(a, b) - w k^3 / 6`, at most the smaller
 *   distance, so the carved skin never lies outside the base or outside the
 *   recess's floor.
 *
 * The recess's floor stands proud of the base at its own border by at least
 * the width `w`, so the correction is zero where the ray leaves the recess and
 * the carved skin there is the base with its tangent and curvature (G2, beyond
 * the declared G1). A recess that opens the skin (nostril, oral fissure, ear
 * canal, lid opening) changes the surface's topology and is an aperture of the
 * lofted chain, not a carve.
 */
export namespace AutoMovieHumanSeamCarve {
  /**
   * A dent in its base: the base's radial distance lowered by the recess's
   * depth, which is zero outside the recess's window.
   *
   * @param base Base radial distance along the ray, mm.
   * @param depth The recess's depth along the ray, mm; must not be positive.
   * @returns Carved radial distance, mm, never over `base`.
   */
  export function dent(base: number, depth: number): number {
    if (!(depth <= 0)) throw new Error(`A subtractive piece has a depth of ${depth} mm`);
    return base + depth;
  }

  /**
   * A recess's floor carved into its base by the cubic smooth minimum.
   *
   * @param base Base radial distance along the ray, mm.
   * @param bottom The recess floor's radial distance along the same ray, mm,
   *   or `Infinity` where the ray misses the recess.
   * @param width Blend width, mm: half the smaller of the recess's depth and
   *   its half extent across the base (`AutoMovieHumanSeamUnion.width`).
   * @returns Carved radial distance, mm, at most `min(base, bottom)` and at
   *   least that less `width / 6`.
   */
  export function floor(base: number, bottom: number, width: number): number {
    if (!(bottom < Infinity)) return base;
    const k: number = Math.max(0, width - Math.abs(base - bottom)) / width;
    return Math.min(base, bottom) - (width * k * k * k) / 6;
  }
}
