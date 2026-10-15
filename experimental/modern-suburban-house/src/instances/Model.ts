import type { IAutoMovieModel } from "@automovie/interface";


/** A generated model with the face role of each part. */
export type Model = {
  /** The model. */
  model: IAutoMovieModel;
  /** Face role of each part, which selects its finish. */
  faceByPart: Readonly<Record<string, string>>;
  /** Collection membership survives material partitioning and inspection. */
  memberByPart?: Readonly<Record<string, string>>;
};
