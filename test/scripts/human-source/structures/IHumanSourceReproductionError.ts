/**
 * Difference between a published field and one representation of it, over
 * the published surface's vertices. `maximumMetres` and `rmsMetres` use the
 * Euclidean vertex difference in Float64 (RMS over vertices where either
 * field moves); `float32MaximumMetres` is the largest coordinate difference
 * after each field is added to the published neutral and rounded to Float32,
 * the precision a GPU vertex buffer receives.
 *
 * @author Samchon
 */
export interface IHumanSourceReproductionError {
  maximumMetres: number;
  rmsMetres: number;
  float32MaximumMetres: number;
  comparedVertices: number;
  differingVertices: number;
}
