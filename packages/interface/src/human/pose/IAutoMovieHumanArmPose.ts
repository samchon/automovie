import type { IAutoMovieHumanElbowPose } from "./IAutoMovieHumanElbowPose";
import type { IAutoMovieHumanForearmPose } from "./IAutoMovieHumanForearmPose";
import type { IAutoMovieHumanHandPose } from "./IAutoMovieHumanHandPose";
import type { IAutoMovieHumanShoulderGirdlePose } from "./IAutoMovieHumanShoulderGirdlePose";
import type { IAutoMovieHumanShoulderPose } from "./IAutoMovieHumanShoulderPose";
import type { IAutoMovieHumanWristPose } from "./IAutoMovieHumanWristPose";

/** Shoulder girdle, arm, wrist and hand of one side, proximal to distal. */
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
