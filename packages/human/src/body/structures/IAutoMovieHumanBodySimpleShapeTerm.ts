import type { IAutoMovieHumanBodySimpleShapeCurve } from "./IAutoMovieHumanBodySimpleShapeCurve";

/**
 * One simple-tier term row: a channel, a gain and the curves whose product
 * scales it. Rows naming the same channel add. The mass direction's rows
 * have the same form, their products being the direction's coefficients.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeTerm {
  /** The body channel the row writes. */
  channel: string;

  /** The row's scale. */
  gain: number;

  /** The curves whose product the gain scales. */
  curves: IAutoMovieHumanBodySimpleShapeCurve[];
}
