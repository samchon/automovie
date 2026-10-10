import type { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * One reference surface as the clearance instrument holds it between
 * readings: its placed local-Float32 copy and the signed queries compiled from it, one per
 * boundary mode. Holding it changes no reading; it only avoids compiling the
 * same reference again for every subject.
 *
 * @author Samchon
 */
export interface IHumanFaceClearanceReference {
  /** Reference reconstructed in the head frame from actual local Float32 and publication TRS. */
  mesh: IAutoMovieMesh;

  /** Exact serialized publication TRS of this rounded reference. */
  transform: string;

  /** Compiled signed queries by boundary mode. */
  queries: Map<
    "closed" | "open",
    ReturnType<typeof createAutoMovieSignedMeshQuery>
  >;
}
