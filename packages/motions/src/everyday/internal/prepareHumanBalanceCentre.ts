
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import { HumanColliders } from "../../posture/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * Prepare one body's actual mass-bearing FK demand for changing postures.
 *
 * @param body The unchanged body owning the canonical profile and classic mass
 *   model.
 * @returns A world-metre mass-centre reader, optionally borrowing its current
 *   synchronous operation's exact FK workspace and genuine ROM projector.
 */
export function prepareHumanBalanceCentre(
  body: IAutoMovieMotionHumanBody,
): (
  posture: IAutoMovieMotionHumanPosture,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
) => IAutoMovieVector3 {
  const bones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    HumanColliders.bones(body),
  );
  return (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieVector3 => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const model: IAutoMovieMotionHumanBody["massModel"] = body.massModel;
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      {},
      read,
      undefined,
      projection,
    ).pose;
    return AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(model, bones(pose, read()));
  };
}
