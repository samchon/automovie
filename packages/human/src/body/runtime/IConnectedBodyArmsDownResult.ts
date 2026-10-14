import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";

/**
 * The arms-down worker reply supplies joint rows and shoulder goals for one document edit.
 *
 * @evidence contracts/common.md#principled-implementation The armsDown result carries ordinary sparse clinical degree rows and TT shoulder goals produced by the current body solve.
 * @evidence contracts/common.md#clear-and-simple-design The editor receives document-level pose data instead of a separately posed mesh or new geometry controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sampled per-pair crossing counts no greater than the reference do not certify unchanged witnesses, continuous clearance, physiological support or clinical tissue validity.
 * @evidence contracts/common.md#meaningful-documentation Members identify reply discriminator, clinical degree rows and shoulder goal payload applied as one editor change.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Pose reply typing performs no build, crossing query or source solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result schema implements no reuse of prior arms-down searches.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no candidate mesh, worker task or retained solve history.
 *
 * @author Samchon
 */
export interface IConnectedBodyArmsDownResult {
  /** Reply kind. */
  operation: "armsDown";

  /** Solved sparse joint rows, in degrees. */
  pose: IAutoMovieJointPose[];

  /** Solved shoulder goals. */
  shoulders: IAutoMovieHumanBodyShoulderPose[];
}
