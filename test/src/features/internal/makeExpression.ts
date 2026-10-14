import { IAutoMovieExpression } from "@automovie/interface";

/**
 * Package the caller's expression preset, intensity and optional blendshape record unchanged. No range or combination is admitted here; tests observe the engine's actual expression validator.
 */
export function makeExpression(
  preset: IAutoMovieExpression["preset"],
  intensity: number,
  blendshapes: IAutoMovieExpression["blendshapes"] = null,
): IAutoMovieExpression {
  return { preset, intensity, blendshapes };
}
