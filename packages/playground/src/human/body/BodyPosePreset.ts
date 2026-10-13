import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";

/**
 * One body or person editor's example pose button. Static lists use the body's authored degree conventions; omitted lists supply no rows. When solve is present, the current body's arms-down solver takes precedence and the static lists are ignored. The panel's standing-joint policy is applied separately.
 *
 * @evidence contracts/common.md#principled-implementation Static authored joint groups remain distinct from a closed current-body solver choice because arms-down placement depends on the actual body rather than one fixed pose snapshot.
 * @evidence contracts/common.md#clear-and-simple-design The descriptor contains button text, two authored coordinate groups and the one currently supported solved choice; document transactions and standing-posture retention remain in the renderer's caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Presets are example requests subject to normal body admission, not claimed clinical capacity or stored expected answers for the numerical solver.
 * @evidence contracts/common.md#meaningful-documentation The comment explains coordinate conventions, omitted-list meaning, solved-choice precedence and the separate standing-joint policy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The preset descriptor performs no pose composition or numerical solve itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This authored data type implements no shared solve or cache of applied body documents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pose arrays are authored input data, with no worker or renderer resource acquired by this schema.
 *
 * @author Samchon
 */
export type BodyPosePreset = {
  /** Button label describing the authored or solved example. */
  name: string;

  /** Static non-humeral joint rows; absent supplies none and solve takes precedence. */
  pose?: IAutoMovieJointPose[];

  /** Static thorax-relative shoulder goals; absent supplies none and solve takes precedence. */
  shoulders?: IAutoMovieHumanBodyShoulderPose[];

  /** Select current-body arms-down solving instead of the static lists. */
  solve?: "armsDown";
};
