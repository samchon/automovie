import { Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkLeg } from "../../actions/internal/walkLeg";
import { HumanFoot } from "../../posture/HumanFoot";
import { hipJoints } from "../../posture/internal/hipJoints";
import { humanPostureHeading } from "../../posture/humanPostureHeading";
import type { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { poseBones } from "../../posture/internal/poseBones";
import type { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import type { stepOverPath } from "./stepOverPath";

/**
 * A step over's swinging leg at a second (`stepOver.plan`): the pelvis lowered
 * as the swinging leg reaches for its landing over the second half of its swing
 * and let go of the lowering it asked from where it left over the first, the
 * trail foot's toe-out restored, the ankle kept in its range, the trail foot
 * stepped down onto its ball, and the foot's sockets raised or moved along the
 * landing ramp until each clears the obstacle by its margin. Read from the
 * plan's body, feet, swing windows, path readers and foot socket demands.
 *
 * @param scope What the plan's swing is corrected from.
 * @returns The swing's correction of a posture at a second.
 */
export function stepOverSwing(
  scope: stepOverSwing.IScope,
): stepOverSwing.Swing {
  const {
    body,
    lead,
    trail,
    yaw,
    end,
    windows,
    heeled,
    smooth,
    footAt,
    needed,
    advance,
    short,
    requested,
    observe,
    forward,
  }: stepOverSwing.IScope = scope;
  return (
    posture: IAutoMovieMotionHumanPosture,
    t: number,
    footings: Record<AutoMovieHumanSide, ReturnType<typeof footAt>>,
    toes: Record<AutoMovieHumanSide, number>,
    channels: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projection: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ): IAutoMovieMotionHumanPosture => {
    // A swinging foot's leg reaches for its landing over the second half
    // of its swing, so the pelvis has come down to where that leg stands
    // when it lands rather than dropping at the contact; over the first
    // half it lets go of the lowering it asked from where it left, so
    // the pelvis does not rise at the toe-off a planted leg had held down.
    const side: AutoMovieHumanSide | undefined = !footings[lead].planted
      ? lead
      : !footings[trail].planted
        ? trail
        : undefined;
    if (side === undefined) return posture;
    const [from, to]: [number, number] = windows[side];
    const limb: AutoMovieHumanLimb = side === "left" ? "leftLeg" : "rightLeg";
    const observed: boolean = channels === undefined || channels.includes(limb);
    const middle: number = (from + to) / 2;
    const hip: IAutoMovieVector3 = hipJoints(
      body,
      posture.root,
      humanPostureHeading(posture),
      posture.joints.hips,
      resolution(),
    )[side];
    const landing: number =
      t <= middle
        ? Math.max(
            0,
            (1 - smooth(t, from, middle)) *
              short(hip, footAt(side, from).placement.ankle),
          )
        : Math.max(0, smooth(t, middle, to) * short(hip, end[side]));
    if (landing > 0) {
      posture.root = { ...posture.root, y: posture.root.y - landing };
      hip.y -= landing;
    }
    if (!observed) return posture;
    const goal: IAutoMovieHumanLimbGoal = posture.limbs[limb]!;
    const own: IAutoMovieQuaternion = footings[side].placement.rotation;
    const direction: ReturnType<typeof HumanFoot.headingPitch> =
      HumanFoot.headingPitch(own);
    let rotation: IAutoMovieQuaternion = own;
    if (side === trail) {
      // The folded trailing knee travels in the sagittal plane. Restore
      // the planted foot's toe-out with zero angular rate at each contact.
      const turn: number = Math.sin((Math.PI * (t - from)) / (to - from)) ** 2;
      rotation = HumanFoot.rotation(
        direction.heading + AutoMovieEngineMath.wrapDegrees(yaw - direction.heading) * turn,
        direction.pitch,
      );
    }
    const range: ReturnType<typeof walkLeg.prepareAnkleRange> =
      walkLeg.prepareAnkleRange(body, HumanFoot.heading(rotation));
    const ranged: IAutoMovieQuaternion = range(hip, goal.point, rotation);
    // The trail foot steps down onto its ball, as one steps down into a
    // tub: where its unloaded ankle cannot hold the foot level under the
    // shank, the foot turns toes-down about the ball of its level
    // placement over the landing half, its toes extended to lie on the
    // floor, so the ball and not the ankle meets the landing.
    let start: IAutoMovieVector3 = goal.point;
    if (side === trail && t > middle && HumanFoot.pitch(ranged) < 0) {
      const pitch: number = HumanFoot.pitch(ranged);
      const onto: number = smooth(t, middle, to);
      start = Vector3.lerp(
        goal.point,
        heeled(trail, goal.point, pitch).ankle,
        onto,
      );
      posture.joints[`${trail}Toes`] = [
        toes[trail] + (Math.max(toes[trail], -pitch) - toes[trail]) * onto,
        0,
        0,
      ];
    }
    posture.limbs[limb] = { ...goal, point: start, rotation: ranged };
    // Extend the toes by the pitch the unloaded ankle cannot supply.
    // The lead heel, ball and toe then follow their own approach and
    // landing ramps. All three retain the full margin above the obstacle.
    if (side === lead)
      posture.joints[`${lead}Toes`] = [
        Math.max(0, direction.pitch - HumanFoot.pitch(ranged)),
        0,
        0,
      ];
    let previousHeight: number = start.y;
    let previousDeficit: number = -Infinity;
    let point: IAutoMovieVector3 = start;
    for (let round: number = 0; round < 6; round++) {
      const posed: ReturnType<typeof resolveHumanPosture.seeded>["pose"] =
        resolveHumanPosture.seeded(
          body,
          posture,
          undefined,
          {},
          resolution,
          requested[side],
          projection,
        ).pose;
      const bones: ReturnType<typeof poseBones> = observe[side](
        posed,
        resolution(),
      );
      let deficit: number = -Infinity;
      let ahead: number = side === trail ? 0 : Infinity;
      for (const socket of HumanFoot.sockets(body, bones, side)) {
        const under: number =
          needed(side, socket.socket, socket.point) - socket.point.y;
        deficit = Math.max(deficit, under);
        if (under > 0.002 && side === trail)
          ahead = Math.max(
            ahead,
            advance(goal.point, socket.socket, socket.point),
          );
      }
      if (deficit <= 0.002) break;

      const decrease: number = previousDeficit - deficit;
      const ratio: number =
        decrease < 1e-3
          ? 1
          : Math.min(4, Math.max(1, (point.y - previousHeight) / decrease));
      previousHeight = point.y;
      previousDeficit = deficit;
      // A heel can swing back over the far face even with its ankle
      // beyond it. Take the shorter correction to the landing ramp
      // when raising the ankle would fold the knee further.
      if (ahead > 0 && ahead < deficit) {
        point = {
          ...point,
          x: point.x + ahead * forward.x,
          z: point.z + ahead * forward.z,
        };
        previousDeficit = -Infinity;
      } else point = { ...point, y: point.y + deficit * ratio };
      posture.limbs[limb] = {
        ...goal,
        point,
        rotation: range(hip, point, rotation),
      };
    }
    return posture;
  };
}

/** What a step over's swing reads and what it is. */
export namespace stepOverSwing {
  /** What a step-over plan corrects its swing from. */
  export interface IScope {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The leading foot. */
    lead: AutoMovieHumanSide;

    /** The trailing foot. */
    trail: AutoMovieHumanSide;

    /** The heading, degrees. */
    yaw: number;

    /** Each foot's landing ankle (`stepOverPath.IPlan.end`). */
    end: stepOverPath.IPlan["end"];

    /** Each foot's swing window (`stepOverPath.IPlan.windows`). */
    windows: stepOverPath.IPlan["windows"];

    /** A foot turned about its ball (`stepOverPath.IPlan.heeled`). */
    heeled: stepOverPath.IPlan["heeled"];

    /** The minimum-jerk share of a window (`stepOverPath.IPlan.smooth`). */
    smooth: stepOverPath.IPlan["smooth"];

    /** A foot at a second (`stepOverPath.IPlan.footAt`). */
    footAt: stepOverPath.IPlan["footAt"];

    /** A socket's least height (`stepOverPath.IPlan.needed`). */
    needed: stepOverPath.IPlan["needed"];

    /** A socket's advance along the ramp (`stepOverPath.IPlan.advance`). */
    advance: stepOverPath.IPlan["advance"];

    /** The lowering one leg asks of the root (`lowerHumanPosture.prepareShort`). */
    short: ReturnType<typeof lowerHumanPosture.prepareShort>;

    /** Each foot's socket bones. */
    requested: Record<AutoMovieHumanSide, ReadonlySet<AutoMovieHumanoidBone>>;

    /** Each foot's socket bones' reader. */
    observe: Record<AutoMovieHumanSide, ReturnType<typeof poseBones.prepare>>;

    /** The heading's forward, on the floor. */
    forward: IAutoMovieVector3;
  }

  /**
   * The swing's correction of a posture at a second.
   *
   * @param posture The lowered posture, corrected in place.
   * @param t Seconds.
   * @param footings Each foot's placement and plant at the second.
   * @param toes Each foot's toe extension, degrees.
   * @param channels The channels demanded of the plan.
   * @param resolution The forward-kinematics reader.
   * @param projection The borrowed range-of-motion projector, if any.
   * @returns The corrected posture.
   */
  export type Swing = (
    posture: IAutoMovieMotionHumanPosture,
    t: number,
    footings: Record<
      AutoMovieHumanSide,
      ReturnType<stepOverPath.IPlan["footAt"]>
    >,
    toes: Record<AutoMovieHumanSide, number>,
    channels: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projection: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
  ) => IAutoMovieMotionHumanPosture;
}
