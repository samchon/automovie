import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmCarry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";

/**
 * A region of a target as a frame: a person's region or a prop's point
 * through the context's aim, a trunk or head region of the performer on
 * the posture, and a limb region of the performer on the entry pose, which
 * a touch that does not move that limb leaves where it was.
 *
 * @param context The action's context.
 * @param target The target.
 * @param seconds Film seconds.
 * @param posture The posture so far.
 * @param entry The entry pose's resolved bones, or a supplier of the bones to read a region off the trunk on, called only for such a region.
 * @returns The point and the outward normal.
 */
export function touchRegionFrame(
  context: Pick<IAutoMovieMotionHumanActionContext, "aim" | "body">,
  target: IAutoMovieMotionTarget,
  seconds: number,
  posture: IAutoMovieMotionHumanPosture,
  entry:
    | ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
    | (() => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>),
  resolution?: Parameters<IAutoMovieMotionHumanArmCarry.ICarry["goal"]>[2],
): Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal"> {
  if (target.kind === "self") {
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      context.body.surfaces.regions[target.region];
    if (!AutoMovieMotionHumanTarget.TRUNK.has(frame.bone)) {
      // The bones are read only here: a caller whose bones cost a pose
      // lends a supplier, which a region on the trunk never calls.
      const placed: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
        resolveAutoMovieHumanoidSurfaces.place(
          frame,
          (typeof entry === "function" ? entry() : entry).get(frame.bone)!,
        );
      return { point: placed.point, normal: placed.normal };
    }
  }
  return AutoMovieMotionHumanTarget.resolve(
    context,
    target,
    seconds,
    posture,
    AutoMovieMotionHumanTarget.DEFAULTS.ahead,
    resolution,
  );
}
