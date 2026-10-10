import type {
  createAutoMovieMeshRayCaster,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";

import type { IHumanFaceHairSeparationReaders } from "./IHumanFaceHairSeparationReaders";
import type { createHumanFaceHairRootBoundary } from "./createHumanFaceHairRootBoundary";

/**
 * The compiled readers of one hair host surface, cached per surface by the
 * hair builder for one evaluation.
 *
 * All four are compiled from the same current closed collider, so contact,
 * rays, separation and root support never disagree about the skin.
 *
 * @author Samchon
 */
export interface IHumanFaceHairHostQueries {
  /** Signed closed-collider query for contact and projection. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;

  /** Ray index for root-to-station exterior intervals. */
  raycaster: ReturnType<typeof createAutoMovieMeshRayCaster>;

  /** Source and represented separation readers for ribbon certification. */
  separation: IHumanFaceHairSeparationReaders;

  /** Root support resolver and proximity reader. */
  boundary: ReturnType<typeof createHumanFaceHairRootBoundary>;
}
