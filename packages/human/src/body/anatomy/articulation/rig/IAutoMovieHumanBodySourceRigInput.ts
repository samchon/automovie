import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyShoulderPose } from "../../../structures/IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieHumanBodyToePose } from "../../../structures/IAutoMovieHumanBodyToePose";
import type { IAutoMovieHumanBodySourceJointGoal } from "./IAutoMovieHumanBodySourceJointGoal";
import type { IAutoMovieHumanBodySourceRig } from "./IAutoMovieHumanBodySourceRig";

/** Shaped source graph and the actual canonical document's named performance requests. */
export interface IAutoMovieHumanBodySourceRigInput {
  /** Existing body rhythm's signed hips contribution, degrees about the right-to-left hip line; positive turns the pelvis forward. */
  pelvicRhythmContributionDegrees?: number;
  /** Source assembly owner's actual shaped rest graph. */
  rig: IAutoMovieHumanBodySourceRig;

  /** Existing public goal owners remain distinct from optional internal coordinates. */
  pose: readonly IAutoMovieJointPose[];

  /** Canonical caller-authored rows before source couplings; omitted by direct callers means pose itself is authored. Conversion still reads prepared pose. */
  authoredPose?: readonly IAutoMovieJointPose[];

  /** Existing thorax-relative TT goals in source degrees. */
  shoulders: readonly IAutoMovieHumanBodyShoulderPose[];

  /** Canonical anatomicalMotion rows; omission of a coordinate retains its source neutral. */
  goals: readonly IAutoMovieHumanBodySourceJointGoal[];
  /** Existing per-ray toe goals; omission is neutral. A requested unsupported coordinate refuses even at zero. */
  toes?: readonly IAutoMovieHumanBodyToePose[];
}
