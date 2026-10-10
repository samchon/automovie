/**
 * The softness of one surface's sag proxy: a base value plus a gain for each
 * named body channel times the document's weight of that channel, held in a
 * closed range.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisSurfaceSagSoftness {
  /** Softness with every listed channel at zero. */
  base: number;

  /** Gain per named body channel, multiplied by the document's weight of it. */
  channels: Record<string, number>;

  /** Closed interval the softness is held in. */
  range: [number, number];
}
