import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { AutoMovieHumanBodySourceJoint } from "./AutoMovieHumanBodySourceJoint";
import type { IAutoMovieHumanBodySourceProjection } from "./IAutoMovieHumanBodySourceProjection";
import type { IAutoMovieHumanBodySourceSite } from "./IAutoMovieHumanBodySourceSite";
import type { IAutoMovieHumanBodySourceToeProjection } from "./IAutoMovieHumanBodySourceToeProjection";

/**
 * One acquired or shared-authored bone in the source's single anatomical rest graph.
 *
 * @evidence contracts/common.md#principled-implementation One closed anatomical bone owns its neutral frame, motion, sites and public projections; a nullable parent identifies graph roots.
 * @evidence contracts/common.md#clear-and-simple-design Geometry attachments and public output frames refer to the same named source node instead of requiring a separately solved skin rig.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Account and qualification remain separate so source registration cannot masquerade as clinical proof or cartilage fit.
 * @evidence contracts/common.md#meaningful-documentation Members document source-frame metres and axes, parent meaning, site ownership, optional toe outputs and acquisition limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The bone-node shape supplies graph data without deciding traversal or projection cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A generation's node references alone do not coordinate or cache source evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The node interface does not own mesh residents or release graph instances retained by its callers.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceBoneNode {
  /** Actual closed anatomical identity independent of public humanoid projection names. */
  id: AutoMovieHumanBodyBoneId;

  /** Kinematic parent in the same graph; relationship does not by itself certify cartilage fit. */
  parent: AutoMovieHumanBodyBoneId | null;

  /** Common neutral world frame, metres +X left/+Y up/+Z forward. */
  rest: IAutoMovieHumanBodyBoneWorldRest;

  /** Joint and tissue owners share these actual source-local site addresses. */
  sites: readonly IAutoMovieHumanBodySourceSite[];

  /** The one source motion owner for this bone's carried frame. */
  joint: AutoMovieHumanBodySourceJoint;

  /** Registered public frames derived from this actual source bone/site. */
  projections: readonly IAutoMovieHumanBodySourceProjection[];

  /** Optional registered skin toe-ray outputs from these same anatomical bone frames. */
  toeProjections?: readonly IAutoMovieHumanBodySourceToeProjection[];

  /** Actual source and neutral-registration protocol, distinct from clinical qualification. */
  account: string;

  /** Source acquisition/authoring limits retained independently of clinical admission. */
  qualification: string;
}
