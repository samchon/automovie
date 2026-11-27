import {
  type IAutoMovieClassifyLocomoteGroundDisplacement,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineLocomoteGroundEpsilon } from "../AutoMovieEngineLocomoteGroundEpsilon";

/*
 * Classify an admitted finite root displacement in metres into no travel,
 * vertical-only travel or ground-plan travel using the shared locomotion
 * epsilon.
 */
export function classifyLocomoteGroundDisplacement(
  displacement: IAutoMovieVector3,
): IAutoMovieClassifyLocomoteGroundDisplacement.IResult {
  const groundDistance: number = Math.hypot(displacement.x, displacement.z);
  const travelDistance: number = Math.hypot(
    displacement.x,
    displacement.y,
    displacement.z,
  );
  const alreadyThere: boolean = travelDistance < AutoMovieEngineLocomoteGroundEpsilon;
  return {
    groundDistance,
    travelDistance,
    alreadyThere,
    verticalOnly:
      alreadyThere === false && groundDistance < AutoMovieEngineLocomoteGroundEpsilon,
  };
}
