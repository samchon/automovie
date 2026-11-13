import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { knockdown } from "../reaction/knockdown";
import { StrikingBody } from "../striking/StrikingBody";

/**
 * The airborne kernel of the gymnastic and jumping laws (#3377): a body in
 * flight is a set of joint angles, a heading and a tip, placed where its
 * centre of mass lies on the drag-free parabola its take-off speed gives.
 *
 * Every posture this kernel places is written by its joints alone, with no
 * limb goal, so turning it rigidly is a change of heading or tip and a move
 * of its root, and the centre of mass read from it is the one the film
 * shows. A posture a law wrote with limb goals is first frozen into the
 * joints its own resolution gives.
 *
 * The physics is the drag-free projectile's closed form, as the jump's
 * flight uses it: the centre rises and falls under gravity alone,
 * so a take-off's vertical speed fixes the flight time to any height, and a
 * body that keeps its shape turns at the constant mean rate of its kept
 * angular momentum, so a turn's angle is that rate times the time. A turn
 * about the centre of mass leaves that point on its parabola.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a flight posture is, why it is written by joints and the physics.
 * @evidence contracts/development/design.md#principled-representation Free functions over the posture record and the engine's mass model; no state.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the gymnastic laws share: freezing, the centre, placing by it, a rigid turn, the fall time, the lowest point, the launch read off a plan and the touchdown search.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Gravity is the only constant; every length is the body's or the plan's.
 */
export namespace GymnasticsFlight {
  /** Gravity, m/s². */
  export const G: number = 9.81;

  /** The engine's mass model of a body. */
  export type Model = ReturnType<typeof resolveAutoMovieCenterOfMass>;

  /**
   * The mass model of a body.
   *
   * @param body The body.
   * @returns The engine's segment model, built once per plan by the callers.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's segment mass model from the body's skeleton and profile.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in segments, once per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The callers keep it for the plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function model(body: IHumanBody): Model {
    return resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
  }

  /**
   * A posture written by joints alone: the angles its resolution gives every
   * bone, its limb goals dropped.
   *
   * @param body The body.
   * @param posture The posture, with or without limb goals.
   * @returns The same pose with no goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and what is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The resolved pose's clinical angles are already clamped and solved, so setting them as joints reproduces the pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolution and one copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One resolution, linear in bones.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function frozen(
    body: IHumanBody,
    posture: IHumanPosture,
  ): IHumanPosture {
    const pose: IAutoMoviePose = resolveHumanPosture(body, posture);
    const joints: IHumanPosture["joints"] = {};
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
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's segment mass model over the posture's bones: forward kinematics alone for a posture of joints, the full resolution for one with goals.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolution and one weighted mean.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones; limb fits only when the posture has goals.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function centre(
    body: IHumanBody,
    model: Model,
    posture: IHumanPosture,
  ): IAutoMovieVector3 {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      Object.keys(posture.limbs).length === 0
        ? StrikingBody.trunk(body, posture)
        : poseBones(body, resolveHumanPosture(body, posture));
    return resolveAutoMovieCenterOfMass.place(model, bones);
  }

  /**
   * A posture moved so its centre of mass is at a point.
   *
   * @param body The body.
   * @param model Its mass model.
   * @param posture A posture written by joints.
   * @param at Where its centre goes, world metres.
   * @returns The posture with its root moved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and what moves.
   * @evidence contracts/development/implementation.md#principled-implementation A translation of the root moves every bone and the centre alike.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One centre and one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function placed(
    body: IHumanBody,
    model: Model,
    posture: IHumanPosture,
    at: IAutoMovieVector3,
  ): IHumanPosture {
    const c: IAutoMovieVector3 = centre(body, model, posture);
    return {
      ...posture,
      root: Vector3.add(posture.root, Vector3.subtract(at, c)),
    };
  }

  /**
   * A posture of joints with no roll turned rigidly about a world point:
   * about the vertical by `yaw`, then about the turned body's left axis by
   * `pitch`, so its heading becomes its own plus `yaw` and its tip its own
   * plus `pitch`.
   *
   * @param posture A posture written by joints, its roll 0.
   * @param pivot The world point that stays.
   * @param yaw Degrees about +Y.
   * @param pitch Degrees of forward tip.
   * @returns The turned posture.
   * @throws {Error} When the posture has a roll or limb goals, which this turn would not carry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order of the two turns, what stays and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation With no roll the root rotation is Ry(yaw)Rx(pitch), so the world rotation taking the old heading to the new one is H(new) H(old)⁻¹; the root goes round the pivot by it and every bone follows the root.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two headings, one quaternion, one rotated point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A posture the turn cannot carry is refused, never turned in part.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function turned(
    posture: IHumanPosture,
    pivot: IAutoMovieVector3,
    yaw: number,
    pitch: number,
  ): IHumanPosture {
    if (posture.roll !== 0 || Object.keys(posture.limbs).length !== 0)
      throw new Error(
        "GymnasticsFlight.turned turns a posture of joints with no roll",
      );
    const after: Pick<IHumanPosture, "yaw" | "pitch" | "roll"> = {
      yaw: posture.yaw + yaw,
      pitch: posture.pitch + pitch,
      roll: 0,
    };
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      resolveHumanPosture.heading(after),
      Quaternion.inverse(resolveHumanPosture.heading(posture)),
    );
    return {
      ...posture,
      ...after,
      root: Vector3.add(
        pivot,
        Quaternion.rotateVector(turn, Vector3.subtract(posture.root, pivot)),
      ),
    };
  }

  /**
   * The seconds a centre launched at a height with a vertical speed takes to
   * come down to another height.
   *
   * @param from The launch height, metres.
   * @param vy The vertical launch speed, m/s, positive upward.
   * @param to The height it comes down to, metres.
   * @returns Seconds, positive; null when the parabola never reaches that height on its way down after the launch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units and the meaning of null.
   * @evidence contracts/development/implementation.md#principled-implementation The later root of from + vy t - g t² / 2 = to.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One discriminant.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A height above the apex returns null instead of a clamped time.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function fall(from: number, vy: number, to: number): number | null {
    const discriminant: number = vy * vy - 2 * G * (to - from);
    if (discriminant < 0) return null;
    const t: number = (vy + Math.sqrt(discriminant)) / G;
    return t > 0 ? t : null;
  }

  /**
   * The centre of a drag-free flight at a second of it.
   *
   * @param from The centre at launch, world metres.
   * @param velocity The launch velocity, m/s.
   * @param t Seconds since the launch.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units.
   * @evidence contracts/development/implementation.md#principled-implementation from + v t - g t² ŷ / 2.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(
    from: IAutoMovieVector3,
    velocity: IAutoMovieVector3,
    t: number,
  ): IAutoMovieVector3 {
    return {
      x: from.x + velocity.x * t,
      y: from.y + velocity.y * t - 0.5 * G * t * t,
      z: from.z + velocity.z * t,
    };
  }

  /**
   * The height of the lowest point of a posture's collision shapes.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The knockdown's floor rest gives the root height that puts the lowest shape on the floor; the posture's own root height less that is where its lowest shape is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics and one pass over the shapes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `knockdown.rest`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lowest(body: IHumanBody, posture: IHumanPosture): number {
    return posture.root.y - knockdown.rest(body, posture);
  }

  /**
   * The centre and its velocity at a ballistic instant of a plan: an
   * instant from which the plan's displayed centre follows a parabola.
   *
   * @param body The body.
   * @param model Its mass model.
   * @param plan The plan.
   * @param seconds The instant, seconds of the plan.
   * @returns The centre, world metres, and its velocity, m/s.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the premise and the units.
   * @evidence contracts/development/implementation.md#principled-implementation Two samples a millisecond and two after the instant: for c(t) = c0 + v t - g t² / 2, v = (c(2δ) - c(δ)) / δ + 3 g δ / 2 and c0 = c(δ) - v δ + g δ² / 2, exact on a parabola.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two centres and two formulas.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Read from the displayed postures, so a plan that is not ballistic there gives what it shows.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two resolutions.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function launch(
    body: IHumanBody,
    model: Model,
    plan: IHumanActionPlan,
    seconds: number,
  ): { centre: IAutoMovieVector3; velocity: IAutoMovieVector3 } {
    const delta: number = 1e-3;
    const one: IAutoMovieVector3 = centre(
      body,
      model,
      plan.posture(seconds + delta),
    );
    const two: IAutoMovieVector3 = centre(
      body,
      model,
      plan.posture(seconds + 2 * delta),
    );
    const velocity: IAutoMovieVector3 = {
      x: (two.x - one.x) / delta,
      y: (two.y - one.y) / delta + 1.5 * G * delta,
      z: (two.z - one.z) / delta,
    };
    return {
      centre: {
        x: one.x - velocity.x * delta,
        y: one.y - velocity.y * delta + 0.5 * G * delta * delta,
        z: one.z - velocity.z * delta,
      },
      velocity,
    };
  }

  /**
   * The first second at which a falling body's lowest point comes down to a
   * height.
   *
   * @param from A second at which the lowest point is above the height.
   * @param until A later second at which it is at or below it.
   * @param lowest The lowest point's height at a second.
   * @param height The height, metres.
   * @returns The second, within a tenth of a millisecond.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the premise on the two seconds and the precision.
   * @evidence contracts/development/implementation.md#principled-implementation Bisection on the sign of lowest(t) - height, which the premise brackets; a body that falls keeps the sign change single in the bracket the callers give (apex to the centre's own arrival).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bisection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms About fifteen evaluations for a bracket of a second.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
      if (lowest(middle) > height) low = middle;
      else high = middle;
    }
    return high;
  }
}
