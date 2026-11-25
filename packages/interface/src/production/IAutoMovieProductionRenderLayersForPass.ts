/** Weighted sampled layers supplied to beauty or structural pass selection. */
export namespace IAutoMovieProductionRenderLayersForPass {
  /**
   * The layers one render pass draws for one film frame.
   *
   * Beauty is alpha-composited, so the `beauty` pass gets every layer with its
   * weight. A structural guide pass carries classifications or geometric
   * fields, where linearly blending pixels invents values no layer holds, so it
   * gets only the heaviest layer, with weight `1`; on an exact tie the later
   * layer wins, which is the incoming shot because
   * `sampleProductionRenderFrame` lists the outgoing layer first. Every result
   * is a deep copy, so a caller mutating it cannot alter the frame another pass
   * reads. A guide pass over an empty layer list throws a `TypeError`; a
   * sampled film frame always has at least one.
   */
  export type IFrame<
    Layer extends {
      /**
       * Dimensionless sampled blend weight. Beauty preserves it; structural
       * passes select the greatest weight with the later layer winning ties,
       * then replace it with 1.
       */
      weight: number;
    },
  > = {
    /**
     * Borrowed ordered layers. Beauty deep-clones every entry, including an
     * empty array; a structural pass requires at least one entry and
     * deep-clones only its selected layer.
     */
    layers: readonly Layer[];
  };
}
