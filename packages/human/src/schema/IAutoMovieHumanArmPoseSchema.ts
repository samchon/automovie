import type { IAutoMovieHumanArmPose } from "@automovie/interface";

import type { IAutoMovieHumanElbowPoseSchema } from "./IAutoMovieHumanElbowPoseSchema";
import type { IAutoMovieHumanForearmPoseSchema } from "./IAutoMovieHumanForearmPoseSchema";
import type { IAutoMovieHumanHandPoseSchema } from "./IAutoMovieHumanHandPoseSchema";
import type { IAutoMovieHumanShoulderGirdlePoseSchema } from "./IAutoMovieHumanShoulderGirdlePoseSchema";
import type { IAutoMovieHumanShoulderPoseSchema } from "./IAutoMovieHumanShoulderPoseSchema";
import type { IAutoMovieHumanWristPoseSchema } from "./IAutoMovieHumanWristPoseSchema";

/**
 * One arm's optional pose controls for typia validation, from the shoulder
 * girdle through the fingers. All angles use degrees from anatomical neutral.
 * The parent pose supplies the anatomical side.
 */
export type IAutoMovieHumanArmPoseSchema = IAutoMovieHumanArmPose & {
  /** Clavicle and scapula. */
  shoulderGirdle?: IAutoMovieHumanShoulderGirdlePoseSchema;

  /** Glenohumeral joint. */
  shoulder?: IAutoMovieHumanShoulderPoseSchema;

  /** Humero-ulnar hinge. */
  elbow?: IAutoMovieHumanElbowPoseSchema;

  /** Radio-ulnar rotation. */
  forearm?: IAutoMovieHumanForearmPoseSchema;

  /** Radiocarpal and midcarpal joints. */
  wrist?: IAutoMovieHumanWristPoseSchema;

  /** Thumb and fingers. */
  hand?: IAutoMovieHumanHandPoseSchema;
};
