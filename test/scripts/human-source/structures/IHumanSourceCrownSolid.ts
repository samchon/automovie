import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One registered crown as a closed solid with its signed distance query.
 *
 * @author Samchon
 */
export interface IHumanSourceCrownSolid {
  /** ISO quadrant and position. */
  id: string;

  /** True for a mandibular crown. */
  mandibular: boolean;

  /** Dental surface vertices of the crown. */
  vertices: number[];

  /** Immutable unique edge incidence from this registered source. */
  edges: readonly (readonly [number, number])[];

  /** The crown component closed by the collider closure triangles on it. */
  mesh: IAutoMovieMesh;

  /** Actual closed-query feature, normal and distance in the same head frame. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;

  /** Signed distance to that closed surface in metres, positive outside; an undefined side refuses. */
  signedDistance: (point: readonly number[]) => number;
}
