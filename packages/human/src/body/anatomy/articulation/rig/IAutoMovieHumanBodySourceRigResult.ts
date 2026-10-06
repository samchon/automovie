import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { AutoMovieHumanBodyToeBone } from "../../../structures/rig/AutoMovieHumanBodyToeBone";

/** The one graph evaluation consumed by rigid parts, deforming attachments and skin projection. */
export interface IAutoMovieHumanBodySourceRigResult {
  /** Bone-local source geometry is carried by these same rest/posed world frames. */
  bones: ReadonlyMap<AutoMovieHumanBodyBoneId, IAutoMovieHumanBodyBoneTransform>;

  /** Resolved named sites in common posed body metres. */
  sites: ReadonlyMap<AutoMovieHumanBodyBoneId, ReadonlyMap<string, IAutoMovieVector3>>;

  /** Source-defined public skin/goal projections, never a separately solved bone rig. */
  projections: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieHumanBodyBoneTransform>;
  /** Same anatomical phalanx frames projected to existing skin-ray identities, before common final ground placement. */
  toeProjections: ReadonlyMap<AutoMovieHumanBodyToeBone, IAutoMovieHumanBodyBoneTransform>;
}
