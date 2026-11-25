/**
 * The named triangle sink supplied while emitting an eye's lid band.
 *
 * The interface package owns these declarations; AutoMovieHumanEyelidSurface in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanEyelidSurface {
  /**
   * The emit argument of AutoMovieHumanEyelidSurface.loop. Lid band from an
   * eye's trim loop on its base chain: one column per lid sample, starting at
   * the loop vertex the sample's outline point projects to, its skin depth and
   * slope taken from the base surface's own derivative across the loop rather
   * than from a cut triangle, so neighbouring columns start from one smooth
   * surface.
   *
   * @param mesh Mesh buffers to grow.
   * @param lid The eye's lid.
   * @param ring Loop vertex of every lid sample, in sample order.
   * @param slopes Unit tangent of the base across the loop, away from the
   *   opening, at every loop vertex.
   * @param emit Triangle sink.
   * @returns Construction paths of the lid margins.
   */
  export type LoopEmit = (name: string, ...corners: number[]) => void;
}
