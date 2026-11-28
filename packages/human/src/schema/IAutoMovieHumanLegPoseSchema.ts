import type { IAutoMovieHumanLegPose } from "@automovie/interface";

import type { IAutoMovieHumanAnklePoseSchema } from "./IAutoMovieHumanAnklePoseSchema";
import type { IAutoMovieHumanFootPoseSchema } from "./IAutoMovieHumanFootPoseSchema";
import type { IAutoMovieHumanHipPoseSchema } from "./IAutoMovieHumanHipPoseSchema";
import type { IAutoMovieHumanKneePoseSchema } from "./IAutoMovieHumanKneePoseSchema";

/**
 * Optional pose controls for one leg, in degrees from anatomical neutral.
 * Supply hip, knee, ankle and foot records independently. The parent pose
 * assigns the anatomical side.
 */
export type IAutoMovieHumanLegPoseSchema = IAutoMovieHumanLegPose & {
  /** Hip joint. */
  hip?: IAutoMovieHumanHipPoseSchema;

  /** Tibiofemoral joint. */
  knee?: IAutoMovieHumanKneePoseSchema;

  /** Talocrural joint. */
  ankle?: IAutoMovieHumanAnklePoseSchema;

  /** Hindfoot, midfoot and toes. */
  foot?: IAutoMovieHumanFootPoseSchema;
};
