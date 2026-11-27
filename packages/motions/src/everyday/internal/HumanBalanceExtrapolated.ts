import { AutoMovieEngineKinematics, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieVector3 } from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { prepareHumanBalanceCentre } from "./prepareHumanBalanceCentre";

/*
 * The dynamic margin at one instant of a movement given by a one-argument
 * posture function.
 * Parameter body: The body whose goals and mass are solved.
 * Parameter at: The movement's posture at a film second, called with that second
 * only.
 * Parameter seconds: The instant to observe.
 * Returns: Signed stability margin in metres, positive inside the foot hull.
 */
export function HumanBalanceExtrapolated(
  body: IAutoMovieMotionHumanBody,
  at: (seconds: number) => IAutoMovieMotionHumanPosture,
  seconds: number,
): number {
  return HumanBalanceExtrapolated.prepare(body)(
    (t: number): IAutoMovieMotionHumanPosture => at(t),
    seconds,
  );
}

/*
 * Dynamic balance observations over a movement's actual three solved postures.
 */
export namespace HumanBalanceExtrapolated {
  /*
   * Bind fixed body/name metadata for repeated actual dynamic margin queries.
   * Parameter body: The unchanged canonical body and its classic profile mass
   * model.
   * Returns: A margin reader taking a current movement and film second, plus
   * optional synchronous FK/ROM loans. Each movement invocation receives its
   * actual time and those same loans; no movement or result enters the
   * preparation.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
  ): (
    at: At,
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => number {
    const centre: ReturnType<typeof prepareHumanBalanceCentre> =
      prepareHumanBalanceCentre(body);
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([
        ...HumanColliders.bones(body),
        ...HumanFoot.bones(body),
      ]);
    const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      requested,
    );
    return (
      at: At,
      seconds: number,
      source?: Parameters<typeof prepareHumanPoseResolution>[0],
      supplied?: ReturnType<typeof prepareHumanPostureProjection>,
    ): number => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(source);
      const projection: ReturnType<typeof prepareHumanPostureProjection> =
        supplied ?? prepareHumanPostureProjection(body);
      return observed(
        body,
        at,
        seconds,
        resolution,
        projection,
        centre,
        frames,
      );
    };
  }
}

/*
 * Current raw movement construction may borrow metadata only during this call.
 */
type At = (
  seconds: number,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
) => IAutoMovieMotionHumanPosture;

/*
 * The central difference of the centre, the full solve at the instant and the
 * support margin of the extrapolated centre.
 */
function observed(
  body: IAutoMovieMotionHumanBody,
  at: At,
  seconds: number,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
  projection: ReturnType<typeof prepareHumanPostureProjection>,
  centre: ReturnType<typeof prepareHumanBalanceCentre>,
  frames?: ReturnType<typeof poseBones.prepare>,
): number {
  // The difference step: a tenth of a 24 Hz film frame, so the difference
  // reads the movement's velocity within the frame it is drawn on.
  const h: number = 1 / 240;
  const a: IAutoMovieVector3 = centre(
    at(seconds - h, resolution, projection),
    resolution,
    projection,
  );
  const b: IAutoMovieVector3 = centre(
    at(seconds + h, resolution, projection),
    resolution,
    projection,
  );
  const velocity: IAutoMovieVector3 = Vector3.scale(
    Vector3.subtract(b, a),
    1 / (2 * h),
  );
  const pose: ReturnType<typeof resolveHumanPosture> =
    resolveHumanPosture.seeded(
      body,
      at(seconds, resolution, projection),
      undefined,
      {},
      resolution,
      undefined,
      projection,
    ).pose;
  const bones: ReturnType<typeof poseBones> =
    frames === undefined
      ? poseBones(body, pose, resolution())
      : frames(pose, resolution());
  const xcom: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassExtrapolate(
    AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(body.massModel, bones),
    velocity,
    AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum(body.measure.hipHeight),
  );
  return AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassMargin(xcom, HumanFoot.base(body, bones));
}
