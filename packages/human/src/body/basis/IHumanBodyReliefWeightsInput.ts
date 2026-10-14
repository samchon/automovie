import type {
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkinReliefPose } from "../structures/IAutoMovieHumanBodySkinReliefPose";

/**
 * Same-revision rest skin and authored clinical pose rows used by the relief model.
 *
 * @evidence contracts/common.md#principled-implementation The admitted basis/table identify joint rules while aligned rest positions, normals and landmarks provide the actual frame read by the relief weights.
 * @evidence contracts/common.md#clear-and-simple-design Geometry, rule parameters and authored pose rows remain separate named fields in one internal call contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This transport carries source rest geometry and declared pose rather than measured crease depths or an anatomical validity certificate.
 * @evidence contracts/common.md#meaningful-documentation Members identify coordinate units, source order, same revision, normal directions and authored pose input; the current surface caller passes document.pose rather than its separately coupled deformation rows.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This relief input interface defines borrowed data and implements no numerical traversal or algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The relief input schema performs no geometry evaluation, memoization or request coordination.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This internal input declaration acquires no buffers, external handles or asynchronous tasks itself.
 * @author Samchon
 */
export interface IHumanBodyReliefWeightsInput {
  /** Admitted basis whose joint contracts name these rest landmarks. */
  basis: IAutoMovieHumanBodyBasis;

  /** Authored spatial and amplitude rules, rather than individual measured crease depth. */
  table: IAutoMovieHumanBodySkinReliefPose;

  /** Native source-ordered XYZ positions in basis metres at the document's shaped rest pose. */
  positions: number[];

  /** Aligned rest-surface normal directions, three coordinates per native vertex. */
  normals: number[];

  /** Same-revision rest landmark positions in the shared basis metre frame. */
  landmarks: Record<string, IAutoMovieVector3>;

  /** Authored requested clinical angles; the current surface caller passes document.pose, and admission remains the pose owner's responsibility. */
  pose: readonly IAutoMovieJointPose[];
}
