import type { AutoMovieHumanBodySimpleParameter } from "./AutoMovieHumanBodySimpleParameter";

/**
 * One piecewise-linear curve of a simple-tier term row: the parameter it reads
 * and its points. The curve holds its end values outside its points.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeCurve {
  /** The simple or derived parameter the curve reads. */
  parameter: AutoMovieHumanBodySimpleParameter;

  /** `[parameter value, factor]` points, increasing by parameter value. */
  points: [number, number][];
}
