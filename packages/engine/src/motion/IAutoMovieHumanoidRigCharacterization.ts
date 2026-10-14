import { AutoMovieHumanoidBone } from "@automovie/interface";

import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/**
 * A normalized humanoid rig characterized for motion retargeting: the semantic
 * bone slots, the concrete node ids the host should address, and the
 * rest-frame/axis tables needed to read clinical angles on that rig.
 * boneMap falls back to the semantic slot name without a profile binding;
 * absent axis and rest-frame entries use the engine's canonical conventions.
 * The map containers are fresh, but table entries may reference supplied data.
 *
 * @evidence contracts/common.md#principled-implementation Characterization joins the skeleton's declared semantic slots to explicit binding node ids or their slot names and retains the clinical conversion tables used by FK; height is the resolved rest-pose Y span used to derive translation scale.
 * @evidence contracts/common.md#clear-and-simple-design Keeps node addressing and clinical-frame interpretation beside the rig identity, allowing target playback to read the same angles as retarget validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only slots the skeleton declares are included, and omitted node mappings use semantic names rather than guesses from a foreign asset hierarchy.
 * @evidence contracts/common.md#meaningful-documentation States rest-height units, explicit mapping fallback, missing clinical-table behavior and shallow ownership of supplied table entries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A rig description contains no FK walk; its producer resolves rest span and builds slot maps.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Clinical entries may be shared by reference with supplied tables, but this type neither invalidates nor caches mutable skeleton measurements.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Map entries are bounded by declared humanoid slots and held by the returned characterization; source geometry and playback tasks are not retained.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanoidRigCharacterization {
  /** Skeleton id the characterization was derived from. */
  skeleton: string;

  /** Humanoid slot -> concrete target node id. */
  boneMap: Partial<Record<AutoMovieHumanoidBone, string>>;

  /** Rest-pose vertical extent in model units, used for root-motion scale. */
  height: number;

  /** Clinical-axis remap to pass to `resolvePose` / viewer playback. */
  jointAxes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Clinical rest-frame remap to pass to `resolvePose` / viewer playback. */
  restFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}
