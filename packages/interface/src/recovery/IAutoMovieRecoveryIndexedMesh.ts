import type { AutoMovieVector3Tuple } from "..";

/**
 * Borrowed registered triangle observations in one caller-declared Cartesian
 * frame. Units are shared by all positions and cutting planes. Canonical
 * addresses name connectivity only; the caller qualifies equal-position aliases
 * before extraction. Keep every array unchanged while a prepared observation
 * closure retains it.
 */
export interface IAutoMovieRecoveryIndexedMesh {
  /** Positions in the common declared Cartesian frame and physical units. */
  vertices: AutoMovieVector3Tuple[];

  /** Oriented faces addressing the supplied positions. */
  triangles: [number, number, number][];

  /** One in-range canonical connectivity address per position. */
  canon: Int32Array;
}
