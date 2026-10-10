/**
 * The anterior lid-edge rows on which free eyelashes are rooted.
 *
 * The source producer registers these native skin vertices separately from
 * the posterior palpebral margins. Both rows run medial to lateral and share
 * the margin record's surface. Evaluators read the final performed skin;
 * the registration supplies no clinical follicle spacing or tissue depth.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularLashRoots {
  /** Anterior upper-lid skin row, medial to lateral. */
  upper: number[];

  /** Anterior lower-lid skin row, medial to lateral. */
  lower: number[];
}
