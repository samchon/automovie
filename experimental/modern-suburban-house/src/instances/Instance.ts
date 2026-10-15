import type { IAutoMovieMeshTransform } from "@automovie/engine";


/** One placement of a repeated exterior model. */
export type Instance = {
  /** Placement identity. */
  id: string;
  /** Model the placement instantiates. */
  modelId: string;
  /** World transform of the placement. */
  transform: IAutoMovieMeshTransform;
};
