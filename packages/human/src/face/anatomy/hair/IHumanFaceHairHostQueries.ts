import type {
  createAutoMovieMeshRayCaster,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";

import type { IHumanFaceHairSeparationReaders } from "./IHumanFaceHairSeparationReaders";
import type { createHumanFaceHairRootBoundary } from "./createHumanFaceHairRootBoundary";

/**
 * The compiled readers of one hair host surface, cached per surface by the hair builder for one evaluation.
 *
 * The four fields share one current closed collider's provenance. Contact, rays and root support use its source coordinates; separation carries both source and Float32-represented hosts. Rounding can change geometry and verdicts, so the mesher checks both representations rather than assuming identical answers.
 *
 * @evidence contracts/common.md#principled-implementation Signed, ray and root-support readers share the source collider; paired separation readers additionally check its actual Float32 representation, whose rounded geometry can differ.
 * @evidence contracts/common.md#clear-and-simple-design One per-surface reader bundle avoids independent acceleration owners at contact, ray and ribbon call sites.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The four readers share actual current geometry, with no substitute collider introduced for an individual consumer.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies the per-evaluation surface cache, each reader's role and the distinction between common provenance and source/Float32 geometric equality.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The bundle type chooses no BVH or separation algorithm; reader construction and full-host scans belong to the hair builder and engine factories.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The builder caches the bundle only per surface within one evaluation, preventing stale reuse across changed evaluated geometry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Compiled query bytes are retained by one evaluation's surface cache; the interface itself opens no extra native handle.
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
