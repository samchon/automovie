/** Type contracts exchanged by AutoMovieHumanAperturePocket; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanAperturePocket {
  /** The emit argument of AutoMovieHumanAperturePocket.loop. Close an opening's trim loop on its base with the same cubic meridians,
  each starting along the base surface's own tangent into the opening
  (the reverse of its unit tangent across the loop, away from it), so the
  rim continues the skin smoothly instead of a cut triangle's plane.
  @param mesh Mesh buffers to grow.
  @param aperture The opening.
  @param ring Loop vertices in order.
  @param rim The loop's points on its base chain, in the same order, mm.
  @param slopes Unit tangent of the base across the loop, away from the
    opening, at each loop vertex.
  @param emit Triangle sink.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Close an opening's trim loop on its base with the same cubic meridians, each starting along the base surface's own tangent into the opening (the reverse of its unit tangent across the loop, away from it), so the rim continues the skin smoothly instead of a cut triangle's plane.
 * @evidence contracts/development/design.md#principled-representation Close an opening's trim loop on its base with the same cubic meridians, each starting along the base surface's own tangent into the opening (the reverse of its unit tangent across the loop, away from it), so the rim continues the skin smoothly instead of a cut triangle's plane. The callable takes name, corners and returns void.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanAperturePocket.LoopEmit is the canonical exchange used by AutoMovieHumanAperturePocket.loop.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanAperturePocket.loop for close an opening's trim loop on its base with the same cubic meridians, each starting along the base surface's own tangent into the opening (the reverse of its unit tangent across the loop, away from it), so the rim continues the skin smoothly instead of a cut triangle's plane.
 */
  export type LoopEmit = (name: string, ...corners: number[]) => void;
}
