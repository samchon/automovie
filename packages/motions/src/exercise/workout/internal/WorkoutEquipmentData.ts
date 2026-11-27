import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { ExerciseKey } from "../../internal/ExerciseKey";
import { knockdown } from "../../../reaction/internal/knockdown";

/*
 * The joint a hip thrust's back turns about.
 */
export const BACK: readonly AutoMovieHumanoidBone[] = ["chest"];

/*
 * The body lying flat on its back, its root at the origin, heading along
 * `+Z`.
 */
export const flat = (
  body: IAutoMovieMotionHumanBody,
): IAutoMovieMotionHumanPosture =>
  ExerciseKey.posed(ExerciseKey.from(body, { pitch: -90 }, {}), 0);

/*
 * Height of the keyed back above its floor support, used by raised equipment.
 */
export const backed = (body: IAutoMovieMotionHumanBody): number => {
  const lying: IAutoMovieMotionHumanPosture = flat(body);
  return knockdown.rest(body, lying) + ExerciseKey.mean(body, lying, BACK).y;
};
