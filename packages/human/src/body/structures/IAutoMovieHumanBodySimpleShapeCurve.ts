import type { AutoMovieHumanBodySimpleParameter } from "./AutoMovieHumanBodySimpleParameter";

/**
 * One piecewise-linear curve of a simple-tier term row: the parameter it reads
 * and its points. The curve holds its end values outside its points.
 *
 * @evidence contracts/common.md#principled-implementation Ordered value-factor pairs define a piecewise-linear term multiplier held constant beyond its endpoints.
 * @evidence contracts/common.md#clear-and-simple-design Each curve names the one simple or derived parameter it reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Endpoint holding is the authored curve contract rather than extrapolation to unseen tissue states.
 * @evidence contracts/common.md#meaningful-documentation Members describe tuple order, ascending abscissae and endpoint behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The simple shape interpolation curves declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The simple shape interpolation curves schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The simple shape interpolation curves type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleShapeCurve {
  /** The simple or derived parameter the curve reads. */
  parameter: AutoMovieHumanBodySimpleParameter;

  /** `[parameter value, factor]` points, increasing by parameter value. */
  points: [number, number][];
}
