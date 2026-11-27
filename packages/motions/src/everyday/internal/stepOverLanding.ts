import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanCrossing,
  IAutoMovieMotionHumanStepOver,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { crossingSurface } from "../../terrain/internal/crossingSurface";

/*
 * Where a step over's feet land: on the floor the step leaves at the stride's
 * landing, or on the named landing surface (`onto`), drawn back from the
 * stride's landing so the toes stay on it but never nearer than the obstacle
 * allows.
 * Parameter context: The action's context, whose `onto` names the surface.
 * Parameter framed: The crossing frame on the starting floor.
 * Parameter rest: Each foot's lateral rest coordinate in that frame, metres.
 * Parameter nearest: The nearest landing the obstacle allows, metres along the
 * path.
 * Parameter stride: The stride's own landing, metres along the path.
 * Returns: The landing's height and place.
 * When the surface is not fixed, level and square to the
 * path, or a landing foot cannot lie on it.
 */
export function stepOverLanding(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStepOver.IParams>,
  framed: HumanFrame.IPrepared,
  rest: Record<AutoMovieHumanSide, number>,
  nearest: number,
  stride: number,
): stepOverLanding.ILanding {
  const onto: IAutoMovieMotionHumanCrossing.ISurface | undefined =
    context.params.onto;
  if (onto === undefined) return { height: 0, z: stride };
  const extent: crossingSurface.IExtent = crossingSurface.read(
    context,
    framed,
    onto,
  );
  const reach: number = Math.max(
    HumanFoot.offset(context.body, "left", "toe").z,
    HumanFoot.offset(context.body, "right", "toe").z,
  );
  const landing: number = Math.max(
    nearest,
    Math.min(stride, extent.far - reach),
  );
  for (const side of ["left", "right"] as const) {
    const heel: number =
      landing + HumanFoot.offset(context.body, side, "heel").z;
    const toe: number = landing + HumanFoot.offset(context.body, side, "toe").z;
    if (
      heel < extent.near ||
      toe > extent.far ||
      rest[side] < extent.left ||
      rest[side] > extent.right
    )
      throw crossingSurface.refusal(
        "onto.point",
        onto.point,
        `the ${side} foot would land from ${heel.toFixed(3)} to ${toe.toFixed(3)} m along the path at ${rest[side].toFixed(3)} m across, off the surface's ${extent.near.toFixed(3)} to ${extent.far.toFixed(3)} m by ${extent.left.toFixed(3)} to ${extent.right.toFixed(3)} m`,
      );
  }
  return { height: extent.height, z: landing };
}

/*
 * Companion types of stepOverLanding.
 */
export namespace stepOverLanding {
  /*
   * Where the ankles land along the path and the height they land on, metres in
   * the crossing frame.
   */
  export interface ILanding {
    /*
     * The landing floor's height over the floor the step leaves.
     */
    height: number;

    /*
     * Both ankles' coordinate along the path.
     */
    z: number;
  }
}
