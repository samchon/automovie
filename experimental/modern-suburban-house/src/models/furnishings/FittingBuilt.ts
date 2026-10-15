import type { IAutoMovieModel, IAutoMoviePropArticulation } from "@automovie/interface";

/** A built fixed fitting: its model, the face role of each part, and how it moves. */
export type FittingBuilt = {
  /** The fitting's model. */
  model: IAutoMovieModel;
  /** Face role of each part, which selects its finish. */
  faceByPart: Readonly<Record<string, string>>;
  /** Doors, drawers or lids the fitting can open. */
  articulation?: IAutoMoviePropArticulation;
  /** Yaw in radians that turns the fitting's front toward the review camera. */
  reviewYaw?: number;
};
