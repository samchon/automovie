import type { IAutoMovieHumanBodyBoneWorldRest } from "../../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";
import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { AutoMovieHumanBodySourceJoint } from "./AutoMovieHumanBodySourceJoint";
import type { IAutoMovieHumanBodySourceProjection } from "./IAutoMovieHumanBodySourceProjection";
import type { IAutoMovieHumanBodySourceSite } from "./IAutoMovieHumanBodySourceSite";
import type { IAutoMovieHumanBodySourceToeProjection } from "./IAutoMovieHumanBodySourceToeProjection";

/** One acquired or shared-authored bone in the source's single anatomical rest graph. */
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
