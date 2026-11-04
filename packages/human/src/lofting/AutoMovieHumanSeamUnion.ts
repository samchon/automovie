/**
 * The volume-adding merge of a piece onto its base, along one ray of a
 * lofted section (J8 additive).
 *
 * A base is an envelope built as if the piece did not exist (the face without
 * its nose, the head without its ears, a limb tube without its reliefs). A
 * piece is built in its own frame about its own centre and axis, and reaches
 * the merge as one of two forms:
 *
 * - a height `h >= 0` over the base along the ray, falling to zero with its
 *   slope and curvature at the edge of its own C2 window (a bump: brow ridge,
 *   fingertip pulp, malleolus). The merge is `base + h`: it never lowers the
 *   base, and the window's C2 edge is the seam;
 * - a radial distance of its own surface along the same ray (a body: the nose
 *   as a whole, the chin pad), or no distance where the ray misses it. The
 *   merge is the cubic smooth maximum of the two distances, whose result is at
 *   least the larger of them, so the merged skin never lies inside the base or
 *   inside the piece.
 *
 * The cubic smooth maximum `max(a, b) + w k^3 / 6`, `k = max(0, w - |a - b|) / w`,
 * is C2 in both distances wherever both exist: its correction and the
 * correction's first and second derivatives vanish where the two distances
 * differ by the width `w`. It swells a flush join by `w / 6` at most. A body
 * piece is therefore sunk into its base at its own border by at least `w`
 * (its border lies at least `w` inside the base), so the correction is zero
 * where the ray leaves the piece and the merged skin there is the base, with
 * position, tangent and curvature: G2, beyond the declared G1.
 *
 * The width is the piece's own: {@link width} derives it from the piece's
 * height and half extent, so no tuned constant enters and the fillet scales
 * with the piece. The piece is never read by the base's lofting curves, and
 * the base never moves the piece: the merge is the only place they meet.
 */
export namespace AutoMovieHumanSeamUnion {
  /**
   * A bump on its base: the base's radial distance raised by the piece's
   * height, which is zero outside the piece's window.
   *
   * @param base Base radial distance along the ray, mm.
   * @param height The piece's height over the base along the ray, mm; must not be negative.
   * @returns Merged radial distance, mm, never under `base`.
   */
  export function bump(base: number, height: number): number {
    if (!(height >= 0)) throw new Error(`An additive piece has a height of ${height} mm`);
    return base + height;
  }

  /**
   * A body piece merged with its base by the cubic smooth maximum.
   *
   * @param base Base radial distance along the ray, mm.
   * @param piece The piece's radial distance along the same ray, mm, or
   *   `-Infinity` where the ray misses the piece.
   * @param width Blend width, mm, from {@link width}.
   * @returns Merged radial distance, mm, at least `max(base, piece)` and at
   *   most that plus `width / 6`.
   */
  export function body(base: number, piece: number, width: number): number {
    if (!(piece > -Infinity)) return base;
    const k: number = Math.max(0, width - Math.abs(base - piece)) / width;
    return Math.max(base, piece) + (width * k * k * k) / 6;
  }

  /**
   * The blend width of a piece from its own size: half the smaller of its
   * height over the base and its half extent across the base. The fillet the
   * smooth maximum draws then stays within the half of the piece next to the
   * base, so the piece keeps its own shape over at least half its height and
   * half its extent, and a large piece rounds its join as a small one does at
   * its own scale.
   *
   * @param height The piece's greatest height over the base, mm.
   * @param halfExtent The piece's least half extent across the base (its window's half width), mm.
   * @returns Width, mm, positive.
   */
  export function width(height: number, halfExtent: number): number {
    const w: number = Math.min(Math.abs(height), Math.abs(halfExtent)) / 2;
    if (!(w > 0)) throw new Error(`A piece of height ${height} and half extent ${halfExtent} mm has no blend width`);
    return w;
  }
}
