/**
 * One triangle surface at neutral: positions in metres (three per vertex) and
 * triangle corner indices.
 *
 * @author Samchon
 */
export interface IHumanSourceSurfaceMesh {
  /** Neutral positions, metres. */
  positions: Float64Array;

  /** Triangle corners, three per triangle. */
  indices: Int32Array;
}
