import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The last closed-collider query a hair contact made, kept so that sampling
 * the same coordinates again returns the identical hit without a new query.
 *
 * The query is deterministic in its point, so reuse changes no answer. The
 * point is an owned copy; the hit is shared and read only.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContactSample {
  /** Owned copy of the queried point. */
  point: IAutoMovieVector3;

  /** The query's answer at that point. */
  hit: ReturnType<ReturnType<typeof createAutoMovieSignedMeshQuery>>;
}
