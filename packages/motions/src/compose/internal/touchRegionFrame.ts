
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanArmCarry, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanTarget, IAutoMovieMotionTarget, IAutoMovieResolvedBone } from "@automovie/interface";

import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";

/*
 * A region of a target as a frame: a person's region or a prop's point through
 * the context's aim, a trunk or head region of the performer on the posture,
 * and a limb region of the performer on the entry pose, which a touch that does
 * not move that limb leaves where it was.
 * Parameter context: The action's context.
 * Parameter target: The target.
 * Parameter seconds: Film seconds.
 * Parameter posture: The posture so far.
 * Parameter entry: The supplier of the bones to read a region off the trunk on (the
 * entry pose's), called only for such a region.
 * Returns: The point and the outward normal.
 */
export function touchRegionFrame(
  context: Pick<IAutoMovieMotionHumanActionContext, TouchRegionFrameContext>,
  target: IAutoMovieMotionTarget,
  seconds: number,
  posture: IAutoMovieMotionHumanPosture,
  entry: TouchRegionFrameEntry,
  resolution?: Parameters<IAutoMovieMotionHumanArmCarry.ICarry["goal"]>[2],
): Pick<IAutoMovieMotionHumanTarget.IPlace, TouchRegionFrameResult> {
  if (target.kind === "self") {
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      context.body.surfaces.regions[target.region];
    if (!AutoMovieMotionHumanTarget.TRUNK.has(frame.bone)) {
      // The bones are read only here, so a region on the trunk never calls
      // the supplier.
      const placed: ReturnType<typeof AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace> =
        AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
          frame,
          entry().get(frame.bone)!,
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

/*
 * The alternatives of `TouchRegionFrameResult`'s site.
 */
type TouchRegionFrameResult = "point" | "normal";

/*
 * The supplier of the bones a region off the trunk is read on.
 */
type TouchRegionFrameEntry = () => ReadonlyMap<
  AutoMovieHumanoidBone,
  IAutoMovieResolvedBone
>;

/*
 * The alternatives of `TouchRegionFrameContext`'s site.
 */
type TouchRegionFrameContext = "aim" | "body";
