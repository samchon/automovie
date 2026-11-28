import type { AutoMovieVector3Tuple } from "..";

/**
 * Observed critical scalar level and adjacent source link components at one
 * canonical vertex.
 */
export interface IAutoMovieMeshCriticalVertex {
  /** Canonical representative vertex address in the original registered mesh. */
  vertex: number;

  /** Signed source scalar height of the vertex in millimetres. */
  level: number;

  /** Original registered Cartesian vertex position in millimetres. */
  p: AutoMovieVector3Tuple;

  /** Count of connected components in the lower source link. */
  lower: number;

  /** Count of connected components in the upper source link. */
  upper: number;

  /** Whether an incident link neighbor shares this vertex's exact scalar level. */
  flat: boolean;

  /** Whether the original source link is a connected simple cycle. */
  manifold: boolean;
}
