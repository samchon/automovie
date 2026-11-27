import { IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

import { deriveCenterOfMass } from "./deriveCenterOfMass";

/*
 * The model's center of mass: its declared IAutoMovieBody.centerOfMass
 * when given, else the volume-weighted centroid derived from geometry
 * (deriveCenterOfMass). `null` when neither is available (no body and no
 * primitive volume to weigh). The single entry point support/balance checks use
 * so an explicit COM (a weighted base) always wins over the geometric one.
 */
export function bodyCenterOfMass(
  model: IAutoMovieModel,
): IAutoMovieVector3 | null {
  return model.body?.centerOfMass ?? deriveCenterOfMass(model);
}
