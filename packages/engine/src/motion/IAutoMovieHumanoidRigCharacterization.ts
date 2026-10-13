import { AutoMovieHumanoidBone } from "@automovie/interface";

import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/**
 * A normalized humanoid rig characterized for motion retargeting: the semantic
 * bone slots, the concrete node ids the host should address, and the
 * rest-frame/axis tables needed to read clinical angles on that rig.
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
