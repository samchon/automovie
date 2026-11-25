import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMoviePreparedChainPlant } from "./IAutoMoviePreparedChainPlant";

/**
 * One target and bend-plane choice evaluated against prepared chain geometry.
 * Coordinates retain the resolved model metre frame; optional clinical axes and
 * rest frames are the same ones final FK and ROM evaluation consume.
 */
export interface IAutoMovieSolvePreparedChainPlantProps {
  /** Shared pose-invariant chain frames and effective clinical domains. */
  prepared: IAutoMoviePreparedChainPlant;

  /** Desired effector point in the resolved model metre frame. */
  target: IAutoMovieVector3;

  /** Caller clinical axes used for quaternion inversion and final FK. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Caller sign/neutral conversion used by the same semantic controls. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

  /** Chosen model-frame bend-plane normal; omission uses the analytic default. */
  bendNormal?: IAutoMovieVector3;
}
