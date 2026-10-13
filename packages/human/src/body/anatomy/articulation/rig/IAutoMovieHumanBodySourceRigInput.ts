import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyShoulderPose } from "../../../structures/IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieHumanBodyToePose } from "../../../structures/IAutoMovieHumanBodyToePose";
import type { IAutoMovieHumanBodySourceJointGoal } from "./IAutoMovieHumanBodySourceJointGoal";
import type { IAutoMovieHumanBodySourceRig } from "./IAutoMovieHumanBodySourceRig";

/**
 * Shaped source graph and the actual canonical document's named performance requests.
 *
 * @evidence contracts/common.md#principled-implementation Prepared public pose and canonical authored rows remain distinct while source goals, shoulders and toe requests address the same shaped rig.
 * @evidence contracts/common.md#clear-and-simple-design One evaluation input groups each named goal authority with optional rhythm contribution, retaining the caller's canonical rows for conflict checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted requests retain source neutral, and unsupported toe coordinates refuse even at zero rather than disappearing during conversion.
 * @evidence contracts/common.md#meaningful-documentation Fields document rhythm degrees and direction, authored-pose fallback, TT frame convention, anatomical goal omission and per-ray toe authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The grouped rig requests specify an evaluation boundary without choosing the graph solver's indexing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Input records distinguish authored and prepared pose dependencies but own no previous resolution result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Evaluation inputs reference caller arrays without retaining tasks or acquiring graph workspaces themselves.
 * @author Samchon
 */
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
