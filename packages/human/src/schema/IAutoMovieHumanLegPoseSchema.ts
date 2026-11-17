import type { IAutoMovieHumanLegPose } from "@automovie/interface";

import type { IAutoMovieHumanAnklePoseSchema } from "./IAutoMovieHumanAnklePoseSchema";
import type { IAutoMovieHumanFootPoseSchema } from "./IAutoMovieHumanFootPoseSchema";
import type { IAutoMovieHumanHipPoseSchema } from "./IAutoMovieHumanHipPoseSchema";
import type { IAutoMovieHumanKneePoseSchema } from "./IAutoMovieHumanKneePoseSchema";

/** Typia admission/schema metadata for IAutoMovieHumanLegPose. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
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
