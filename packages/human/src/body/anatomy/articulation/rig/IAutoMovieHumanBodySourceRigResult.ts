import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieHumanBodyToeBone } from "../../../structures/rig/AutoMovieHumanBodyToeBone";
import type { IAutoMovieHumanBodyBoneTransform } from "../../../structures/rig/IAutoMovieHumanBodyBoneTransform";
import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";

/**
 * The one graph evaluation consumed by rigid parts, deforming attachments and skin projection.
 *
 * @evidence contracts/common.md#principled-implementation Bone frames, named sites and public projections are maps from one graph evaluation; toe projections use those same phalanx frames before final ground placement.
 * @evidence contracts/common.md#clear-and-simple-design The result groups all anatomical and public outputs so rigid parts, attachments and skin consume one transform authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Public frames are projections of actual source bones, not an independently solved replacement rig aligned afterward.
 * @evidence contracts/common.md#meaningful-documentation Map comments specify rest/posed ownership, common posed metres, projected frame provenance and pre-ground-placement toe semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Readonly map types expose keyed outputs without prescribing how the resolver populates or indexes them.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A completed result may be shared by downstream consumers, but this interface chooses no cross-evaluation reuse or invalidation policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result's maps belong to their producing evaluation; the type itself owns no eviction process or foreign resource.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceRigResult {
  /** Bone-local source geometry is carried by these same rest/posed world frames. */
  bones: ReadonlyMap<
    AutoMovieHumanBodyBoneId,
    IAutoMovieHumanBodyBoneTransform
  >;

  /** Resolved named sites in common posed body metres. */
  sites: ReadonlyMap<
    AutoMovieHumanBodyBoneId,
    ReadonlyMap<string, IAutoMovieVector3>
  >;

  /** Source-defined public skin/goal projections, never a separately solved bone rig. */
  projections: ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieHumanBodyBoneTransform
  >;

  /** Same anatomical phalanx frames projected to existing skin-ray identities, before common final ground placement. */
  toeProjections: ReadonlyMap<
    AutoMovieHumanBodyToeBone,
    IAutoMovieHumanBodyBoneTransform
  >;
}
