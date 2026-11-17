import type { IAutoMovieHumanElbowPose } from "./IAutoMovieHumanElbowPose";
import type { IAutoMovieHumanForearmPose } from "./IAutoMovieHumanForearmPose";
import type { IAutoMovieHumanHandPose } from "./IAutoMovieHumanHandPose";
import type { IAutoMovieHumanShoulderGirdlePose } from "./IAutoMovieHumanShoulderGirdlePose";
import type { IAutoMovieHumanShoulderPose } from "./IAutoMovieHumanShoulderPose";
import type { IAutoMovieHumanWristPose } from "./IAutoMovieHumanWristPose";

/** Shoulder girdle, arm, wrist and hand of one side, proximal to distal.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Shoulder girdle, arm, wrist and hand of one side, proximal to distal.
 * @evidence contracts/development/design.md#principled-representation `shoulderGirdle`: Clavicle and scapula. `shoulder`: Glenohumeral joint. `elbow`: Humero-ulnar hinge.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanArmPose is the canonical exchange used by IAutoMovieHumanArmPoseSchema, IAutoMovieHumanPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `shoulderGirdle`: Clavicle and scapula. `shoulder`: Glenohumeral joint. `elbow`: Humero-ulnar hinge. `forearm`: Radio-ulnar rotation. `wrist`: Radiocarpal and midcarpal joints. `hand`: Thumb and fingers.
 */
export interface IAutoMovieHumanArmPose {
  /** Clavicle and scapula. */
  shoulderGirdle?: IAutoMovieHumanShoulderGirdlePose;

  /** Glenohumeral joint. */
  shoulder?: IAutoMovieHumanShoulderPose;

  /** Humero-ulnar hinge. */
  elbow?: IAutoMovieHumanElbowPose;

  /** Radio-ulnar rotation. */
  forearm?: IAutoMovieHumanForearmPose;

  /** Radiocarpal and midcarpal joints. */
  wrist?: IAutoMovieHumanWristPose;

  /** Thumb and fingers. */
  hand?: IAutoMovieHumanHandPose;
}
