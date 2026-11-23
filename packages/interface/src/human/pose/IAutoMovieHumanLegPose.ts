import type { IAutoMovieHumanAnklePose } from "./IAutoMovieHumanAnklePose";
import type { IAutoMovieHumanFootPose } from "./IAutoMovieHumanFootPose";
import type { IAutoMovieHumanHipPose } from "./IAutoMovieHumanHipPose";
import type { IAutoMovieHumanKneePose } from "./IAutoMovieHumanKneePose";

/** Hip, knee, ankle, foot and toes of one side, proximal to distal. */
export interface IAutoMovieHumanLegPose {
  /** Hip joint. */
  hip?: IAutoMovieHumanHipPose;

  /** Tibiofemoral joint. */
  knee?: IAutoMovieHumanKneePose;

  /** Talocrural joint. */
  ankle?: IAutoMovieHumanAnklePose;

  /** Hindfoot, midfoot and toes. */
  foot?: IAutoMovieHumanFootPose;
}
