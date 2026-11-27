import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPosturePreparation } from "../../posture/internal/HumanPosturePreparation";
import { prepareHumanFreeCurve } from "../../posture/internal/prepareHumanFreeCurve";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { jumpAirborne } from "./jumpAirborne";

/*
 * Prepare the jump's free-flight reader so a single canonical solve supplies
 * both its mass offset and its translated displayed posture for each query.
 * Original clinical joints and free leg demands stay in the posture, and the
 * placed solve travels with it (`HumanPosturePreparation.IPlaced`).
 * Parameter body: The plan's unchanged body.
 * Parameter model: Its physical mass model.
 * Parameter shape: The same achieved endpoints and authored free-goal interpolation
 * used throughout flight.
 * Parameter duration: Physical flight duration in seconds for the
 * velocity-continuation angular resolution law.
 * Returns: A reader of flight share in [0,1] and demanded world COM in metres,
 * optionally borrowing its synchronous parent's exact FK source and genuine
 * same-body ROM projector.
 */
export function prepareJumpFlight(
  body: IAutoMovieMotionHumanBody,
  model: IAutoMovieResolveCenterOfMass.IModel,
  shape: jumpAirborne.IShape,
  duration: number,
): prepareJumpFlight.IReader {
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const segment of model.segments) requested.add(segment.bone);
  const shapeAt: ReturnType<typeof jumpAirborne.prepare> =
    jumpAirborne.prepare(shape);
  const root: IAutoMovieVector3 = { ...shape.start.root };
  const curve: ReturnType<typeof prepareHumanFreeCurve> = prepareHumanFreeCurve(
    body,
    (share: number): IAutoMovieMotionHumanPosture => shapeAt(root, share),
    duration,
  );

  return (
    share: number,
    centre: IAutoMovieVector3,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): HumanPosturePreparation.IPlaced => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const prepared: HumanPosturePreparation.IPrepared = curve(
      share,
      read,
      projection,
    );
    return HumanPosturePreparation.placed(
      prepared,
      model,
      requested,
      centre,
      read,
    );
  };
}

/*
 * Native jump flight shape reader.
 */
export namespace prepareJumpFlight {
  /*
   * Read the achieved shape at the requested ballistic centre.
   */
  export interface IReader {
    /*
     * Normalized flight share, world COM, and an optional current native
     * FK/projector loan.
     */
    (
      share: number,
      centre: IAutoMovieVector3,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    ): HumanPosturePreparation.IPlaced;
  }
}
