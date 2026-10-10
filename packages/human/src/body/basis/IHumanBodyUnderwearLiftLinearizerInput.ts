/**
 * Fixed material basis for analytic derivatives of the actual normal lift.
 *
 * @author Samchon
 */
export interface IHumanBodyUnderwearLiftLinearizerInput {
  /** Original cut coordinates in posed skin metres; never mutated. */
  points: readonly number[];

  /** Original supplied source directions in matching vertex order. */
  normals: readonly number[];

  /** Original indexed material triangles; no face is removed. */
  indices: readonly number[];

  /** Existing signed lift in metres, including zero identity. */
  offsetMetres: number;

  /** Original cut vertex for each connected component-local vertex. */
  sourceVertices: readonly number[];
}
