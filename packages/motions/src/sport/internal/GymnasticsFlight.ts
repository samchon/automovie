import { AutoMovieGravity, Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanLimb, AutoMovieHumanoidBone, IAutoMovieHumanLimbGoal, IAutoMovieJointPose, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanGymnasticsFlight, IAutoMovieMotionHumanPosture, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { knockdown } from "../../reaction/internal/knockdown";
import { prepareGymnasticsLaunch } from "./prepareGymnasticsLaunch";

/**
 * The airborne kernel of the gymnastic and jumping laws: a body in flight is a
 * set of joint angles, a heading and a tip, placed where its centre of mass
 * lies on the drag-free parabola its take-off speed gives.
 *
 * A flight posture is written by its joints alone, with no limb goal, so
 * placing it by its centre moves only its root and the centre read from it is
 * the one the film shows; a posture a law wrote with limb goals is first frozen
 * into the joints its own resolution gives. A rigid turn carries either kind,
 * its world goals going round with its root.
 *
 * The physics is the drag-free projectile's closed form, as the jump's flight
 * uses it: the centre rises and falls under gravity alone, so a take-off's
 * vertical speed fixes the flight time to any height, and a body that keeps its
 * shape turns at the constant mean rate of its kept angular momentum, so a
 * turn's angle is that rate times the time. A turn about the centre of mass
 * leaves that point on its parabola.
 */
export namespace GymnasticsFlight {
  /**
   * The mass model of a body.
   *
   * @param body The body.
   * @returns The body's canonical segment model, prepared when that body is
   *   created.
   */
  export function model(
    body: Pick<IAutoMovieMotionHumanBody, "massModel">,
  ): IAutoMovieResolveCenterOfMass.IModel {
    return body.massModel;
  }

  /**
   * A posture written by its achieved clinical angles, its limb goals cleared
   * and other raw fields kept under their original ownership.
   *
   * @param body The body.
   * @param posture The posture, with or without limb goals.
   * @param resolution Optional exact FK source borrowed only during this
   *   synchronous solve.
   * @param projection Optional genuine same-body ROM projector borrowed only
   *   during this synchronous solve.
   * @returns The raw view with actual clinical joints and no limb goals; other
   *   raw fields, including any digit/rotation demands, remain unchanged.
   */
  export function frozen(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    return frozenView(
      posture,
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        undefined,
        resolution,
        undefined,
        projection,
      ).pose,
    );
  }

  /**
   * Resolve one actual source once and expose its original frozen clinical view
   * beside the actual canonical pose, so a caller can also read its COM.
   *
   * @param body The unchanged canonical body.
   * @param posture The original raw posture, whose complete goals still resolve
   *   before freezing.
   * @param resolution Optional exact FK source borrowed only for this source
   *   query.
   * @param projection Optional genuine same-body ROM projector borrowed only
   *   for this source query.
   * @returns The raw view with limb goals cleared and the same actual resolver
   *   pose; copied clinical tuples are separate from canonical joint records,
   *   while other raw fields, including any digit/rotation demands, retain
   *   frozen's original borrowed ownership.
   */
  export function freeze(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IFreezeResult {
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      undefined,
      resolution,
      undefined,
      projection,
    ).pose;
    return { posture: frozenView(posture, pose), pose };
  }

  /**
   * Copy actual canonical clinical values under the original limb-only freeze
   * policy.
   */
  function frozenView(
    posture: IAutoMovieMotionHumanPosture,
    pose: IAutoMoviePose,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const joint of pose.joints as readonly IAutoMovieJointPose[])
      // A joint the pose leaves unset stands at clinical zero, as the
      // resolver itself reads it.
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
    return { ...posture, joints, limbs: {} };
  }

  /**
   * The centre of mass of a posture.
   *
   * @param body The body.
   * @param model Its mass model.
   * @param posture The posture.
   * @param resolution Optional exact FK reader or lazy supplier borrowed from
   *   this synchronous body's evaluation.
   * @param projection Optional genuine same-body direct ROM projector borrowed
   *   only during this synchronous reading.
   * @returns World metres.
   */
  export function centre(
    body: IAutoMovieMotionHumanBody,
    model: IAutoMovieResolveCenterOfMass.IModel,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieVector3 {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const canonical: boolean = model === body.massModel;
    let requested: ReadonlySet<AutoMovieHumanoidBone>;
    if (canonical) requested = HumanColliders.bones(body);
    else {
      const massBones: Set<AutoMovieHumanoidBone> = new Set();
      for (const segment of model.segments) massBones.add(segment.bone);
      requested = massBones;
    }
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      undefined,
      read,
      undefined,
      projection,
    ).pose;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
      read(),
      requested,
    );
    return AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(model, bones);
  }

  /**
   * A posture moved so its centre of mass is at a point.
   *
   * @param body The body.
   * @param model Its mass model.
   * @param posture A posture written by joints.
   * @param at Where its centre goes, world metres.
   * @returns The posture with its root moved.
   */
  export function placed(
    body: IAutoMovieMotionHumanBody,
    model: IAutoMovieResolveCenterOfMass.IModel,
    posture: IAutoMovieMotionHumanPosture,
    at: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    const c: IAutoMovieVector3 = centre(body, model, posture);
    return {
      ...posture,
      root: Vector3.add(posture.root, Vector3.subtract(at, c)),
    };
  }

  /**
   * A posture with no roll turned rigidly about a world point: about the
   * vertical by `yaw`, then about the turned body's left axis by `pitch`, so
   * its heading becomes its own plus `yaw` and its tip its own plus `pitch`.
   * The root and every world limb goal (its point, its bend hint and its
   * rotation) go round with it; a goal attached to a bone moves with that bone
   * already and is kept.
   *
   * @param posture The posture, its roll 0.
   * @param pivot The world point that stays.
   * @param yaw Degrees about +Y.
   * @param pitch Degrees of forward tip.
   * @returns The turned posture.
   * @throws {Error} When the posture has a roll, which this turn would not
   *   carry.
   */
  export function turned(
    posture: IAutoMovieMotionHumanPosture,
    pivot: IAutoMovieVector3,
    yaw: number,
    pitch: number,
  ): IAutoMovieMotionHumanPosture {
    return prepareTurned(posture, pivot)(yaw, pitch);
  }

  /**
   * Prepare rigid turns of one unchanged no-roll posture about one fixed
   * world-metre pivot. The caller keeps the source and its borrowed nested
   * articulation/goals unchanged until it releases the returned reader.
   *
   * @param posture The original unchanged raw posture, with roll zero.
   * @param pivot The unchanged world pivot, metres.
   * @returns A reader of yaw and pitch increments in degrees, retaining the
   *   original turn order and raw-goal policy.
   * @throws {Error} When the source has a roll the original turn cannot carry.
   */
  export function prepareTurned(
    posture: IAutoMovieMotionHumanPosture,
    pivot: IAutoMovieVector3,
  ): (yaw: number, pitch: number) => IAutoMovieMotionHumanPosture {
    if (Math.abs(posture.roll) > 1e-9)
      throw new Error("GymnasticsFlight.turned turns a posture with no roll");
    const before: IAutoMovieQuaternion = Quaternion.inverse(
      humanPostureHeading(posture),
    );
    const rootOffset: IAutoMovieVector3 = Vector3.subtract(posture.root, pivot);
    const rootAt: (turn: IAutoMovieQuaternion) => IAutoMovieVector3 = (
      turn: IAutoMovieQuaternion,
    ): IAutoMovieVector3 =>
      Vector3.add(pivot, Quaternion.rotateVector(turn, rootOffset));
    return (yaw: number, pitch: number): IAutoMovieMotionHumanPosture => {
      const after: Pick<IAutoMovieMotionHumanPosture, PrepareTurnedAfter> = {
        yaw: posture.yaw + yaw,
        pitch: posture.pitch + pitch,
        roll: 0,
      };
      const heading: IAutoMovieQuaternion = humanPostureHeading(after);
      const turn: IAutoMovieQuaternion = Quaternion.multiply(heading, before);
      const round: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
        point: IAutoMovieVector3,
      ): IAutoMovieVector3 =>
        Vector3.add(
          pivot,
          Quaternion.rotateVector(turn, Vector3.subtract(point, pivot)),
        );
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
      for (const [limb, goal] of Object.entries(posture.limbs) as [
        AutoMovieHumanLimb,
        IAutoMovieHumanLimbGoal,
      ][])
        limbs[limb] =
          goal.on !== undefined
            ? goal
            : {
                ...goal,
                point: round(goal.point),
                bend: round(goal.bend),
                ...(goal.rotation === undefined
                  ? {}
                  : { rotation: Quaternion.multiply(turn, goal.rotation) }),
              };
      return { ...posture, ...after, root: rootAt(turn), limbs };
    };
  }

  /**
   * The seconds a centre launched at a height with a vertical speed takes to
   * come down to another height.
   *
   * @param from The launch height, metres.
   * @param vy The vertical launch speed, m/s, positive upward.
   * @param to The height it comes down to, metres.
   * @returns Seconds, positive; null when the parabola never reaches that
   *   height on its way down after the launch.
   */
  export function fall(from: number, vy: number, to: number): number | null {
    const discriminant: number =
      vy * vy - 2 * AutoMovieGravity.STANDARD * (to - from);
    if (discriminant < 0) return null;
    const t: number =
      (vy + Math.sqrt(discriminant)) / AutoMovieGravity.STANDARD;
    return t > 0 ? t : null;
  }

  /**
   * The centre of a drag-free flight at a second of it.
   *
   * @param from The centre at launch, world metres.
   * @param velocity The launch velocity, m/s.
   * @param t Seconds since the launch.
   * @returns World metres.
   */
  export function at(
    from: IAutoMovieVector3,
    velocity: IAutoMovieVector3,
    t: number,
  ): IAutoMovieVector3 {
    return {
      x: from.x + velocity.x * t,
      y: from.y + velocity.y * t - 0.5 * AutoMovieGravity.STANDARD * t * t,
      z: from.z + velocity.z * t,
    };
  }

  /**
   * The height of the lowest point of a posture's collision shapes.
   *
   * @param body The body.
   * @param posture The posture.
   * @param resolution Optional exact FK reader or supplier borrowed from the
   *   current synchronous touchdown search.
   * @param projection Optional genuine same-body ROM projector borrowed only
   *   during this reading.
   * @returns World metres.
   */
  export function lowest(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): number {
    return (
      posture.root.y - knockdown.rest(body, posture, resolution, projection)
    );
  }

  /**
   * Prepare this unchanged body's original lowest-point reading for all actual
   * postures in one touchdown search, without retaining a sample.
   *
   * @param body The fixed canonical body, rig and physical profile.
   * @returns A reader of each current posture and optional synchronous FK/ROM
   *   loans, returning the original lowest world height in metres.
   */
  export function prepareLowest(
    body: IAutoMovieMotionHumanBody,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => number {
    const rest: ReturnType<typeof knockdown.prepareRest> =
      knockdown.prepareRest(body);
    return (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): number => posture.root.y - rest(posture, resolution, projection);
  }

  /**
   * The centre and its velocity at a ballistic instant of a plan: an instant
   * from which the plan's displayed centre follows a parabola.
   *
   * @param body The body.
   * @param model Its mass model.
   * @param plan The plan.
   * @param seconds The instant, seconds of the plan.
   * @returns The centre, world metres, and its velocity, m/s.
   */
  export function launch(
    body: IAutoMovieMotionHumanBody,
    model: IAutoMovieResolveCenterOfMass.IModel,
    plan: IAutoMovieMotionHumanActionPlan,
    seconds: number,
  ): IAutoMovieMotionHumanGymnasticsFlight.ILaunchResult {
    return prepareGymnasticsLaunch(body, model)(plan, seconds);
  }

  /**
   * The first second at which a falling body's lowest point comes down to a
   * height.
   *
   * @param from A second at which the lowest point is above the height.
   * @param until A later second at which it is at or below it.
   * @param lowest The lowest point's height at a second.
   * @param height The height, metres.
   * @returns The second, within a tenth of a millisecond, or within adjacent
   *   seconds where they lie further apart than that.
   */
  export function touchdown(
    from: number,
    until: number,
    lowest: (seconds: number) => number,
    height: number,
  ): number {
    let low: number = from;
    let high: number = until;
    while (high - low > 1e-4) {
      const middle: number = (low + high) / 2;
      if (middle === low || middle === high) break;
      if (lowest(middle) > height) low = middle;
      else high = middle;
    }
    return high;
  }
}

/** The alternatives of `PrepareTurnedAfter`'s site. */
type PrepareTurnedAfter = "yaw" | "pitch" | "roll";

/** The record of `IFreezeResult`'s site. */
type IFreezeResult = {
  posture: IAutoMovieMotionHumanPosture;
  pose: IAutoMoviePose;
};
