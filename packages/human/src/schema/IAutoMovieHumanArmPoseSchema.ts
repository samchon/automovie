import type { IAutoMovieHumanArmPose } from "@automovie/interface";

import type { IAutoMovieHumanElbowPoseSchema } from "./IAutoMovieHumanElbowPoseSchema";
import type { IAutoMovieHumanForearmPoseSchema } from "./IAutoMovieHumanForearmPoseSchema";
import type { IAutoMovieHumanHandPoseSchema } from "./IAutoMovieHumanHandPoseSchema";
import type { IAutoMovieHumanShoulderGirdlePoseSchema } from "./IAutoMovieHumanShoulderGirdlePoseSchema";
import type { IAutoMovieHumanShoulderPoseSchema } from "./IAutoMovieHumanShoulderPoseSchema";
import type { IAutoMovieHumanWristPoseSchema } from "./IAutoMovieHumanWristPoseSchema";

/** Typia admission/schema metadata for IAutoMovieHumanArmPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
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
