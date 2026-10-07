/** Actual offset sheets on one conforming source-incidence triangulation.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularIndexedShellInput {
  /** Outer sheet, head-frame metres, aligned with the supplied sheet vertices. */
  outer: number[];

  /** Inner sheet at the caller's unchanged normal thickness, metres. */
  inner: number[];

  /** Actual conforming sheet triangles. */
  indices: number[];

  /** Oriented boundary edges of the same sheet. */
  boundary: [number, number][];
}
