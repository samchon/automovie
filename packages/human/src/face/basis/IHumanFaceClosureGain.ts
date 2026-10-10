/**
 * The closure gains one state applies per unit closure weight.
 *
 * `ratio` is the central pair's gain, applied to every closure row off the
 * lips surface and away from the fissure. `lips` holds one gain per vertex of
 * the lips surface: each margin chain vertex's solved contact gain, blending to
 * `ratio` away from the fissure.
 *
 * @author Samchon
 */
export interface IHumanFaceClosureGain {
  /** The central pair's gain per unit closure weight. */
  ratio: number;

  /** Gain per unit closure weight for each vertex of the lips surface. */
  lips: Float64Array;
}
