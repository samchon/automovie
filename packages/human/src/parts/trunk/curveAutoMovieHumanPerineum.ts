import { IAutoMovieSurfaceNetwork } from "@automovie/engine";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanTrunkSweep } from "./AutoMovieHumanTrunkSweep";
import { sweepAutoMovieHumanTrunkBody } from "./sweepAutoMovieHumanTrunkBody";

/**
 * The three boundaries of the perineal gusset: the central seam and each groin edge, continuing the trunk's anterior and posterior meridians beneath the pelvis.
 *
 * The curves share their longitudinal profile, with the groin edges displaced to either side. Their endpoints are network nodes on the crotch section; their downward-facing normal makes each hip bridge leave laterally within the gusset's tangent plane.
 *
 * @param props The crotch contour, its height and the neighboring cage row's height, millimetres
 * @returns The named curve boundaries, in metres
 */
export function curveAutoMovieHumanPerineum(props: {
  crotch: sweepAutoMovieHumanTrunkBody.IContour;
  height: number;
  row: number;
}): Record<string, IAutoMovieSurfaceNetwork.ICurve> {
  const { toMetres, fixed }: typeof AutoMovieHumanTrunkSweep =
    AutoMovieHumanTrunkSweep;
  const front: number = props.crotch.centre + props.crotch.depth;
  const back: number = props.crotch.centre - props.crotch.depth;
  const underY: number = props.height - FORK.drop * props.row;
  // a curve under the crotch from a front node to a back node, its two inner points `x` millimetres across
  const under: (
    from: string,
    to: string,
    x: number,
  ) => IAutoMovieSurfaceNetwork.ICurve = (
    from: string,
    to: string,
    x: number,
  ): IAutoMovieSurfaceNetwork.ICurve => ({
    from,
    to,
    // the curve first runs down the front and back as the surface does, then turns under the crotch
    through: [
      toMetres(
        AutoMovieHumanVector.of(
          x,
          props.height - FORK.lip * props.row,
          front - FORK.lipInset * (front - back),
        ),
      ),
      toMetres(
        AutoMovieHumanVector.of(x, underY, front - FORK.inset * (front - back)),
      ),
      toMetres(
        AutoMovieHumanVector.of(x, underY, back + FORK.inset * (front - back)),
      ),
      toMetres(
        AutoMovieHumanVector.of(
          x,
          props.height - FORK.lip * props.row,
          back + FORK.lipInset * (front - back),
        ),
      ),
    ],
    segments: fixed(6),
    normal: { x: 0, y: -1, z: 0 },
  });
  return {
    seam: under("seamFront", "seamBack", 0),
    groinLeft: under("groinLeftFront", "groinLeftBack", FORK.half),
    groinRight: under("groinRightFront", "groinRightBack", -FORK.half),
  };
}

/**
 * The curves under the crotch that bound the gusset: each starts on the trunk's lowest row, runs down the front `lip` of the lowest row's height while coming in `lipInset` of the crotch depth, as the surface there does, then turns under the crotch, its two inner points `drop` rows below the crotch and `inset` of the depth in from the front and back; the groin edges lie `half` millimetres either side of the seam. The thighs part in a cleft about as deep as the reference meshes' just below the crotch.
 */
const FORK: Record<"drop" | "inset" | "half" | "lip" | "lipInset", number> = {
  drop: 1.2,
  inset: 0.3,
  half: 20,
  lip: 0.6,
  lipInset: 0.06,
};
