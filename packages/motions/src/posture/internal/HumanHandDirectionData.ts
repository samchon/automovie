import type { AutoMovieHumanSide } from "@automovie/interface";
import type { IAutoMovieMotionHumanHand } from "@automovie/interface";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The named axes mirror about the performer's centreline.
 */
export const AXES: Readonly<Record<AutoMovieHumanSide, IAxes>> = {
  left: axes(1),
  right: axes(-1),
};

/*
 * Bind the six local unit axes for the acting hand's lateral sign.
 */
export function axes(sign: number): IAxes {
  return {
    out: { x: sign, y: 0, z: 0 },
    in: { x: -sign, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    down: { x: 0, y: -1, z: 0 },
    forward: { x: 0, y: 0, z: 1 },
    back: { x: 0, y: 0, z: -1 },
  };
}

/*
 * The unchanged floor directions for one side, before turning by yaw.
 */
export type IAxes = Readonly<
  Record<IAutoMovieMotionHumanHand.Axis, Readonly<IAutoMovieVector3>>
>;
