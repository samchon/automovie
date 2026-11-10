import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { IKickGeometry } from "./IKickGeometry";
import { KickForm } from "./KickForm";
import { StrikingBody } from "./StrikingBody";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/**
 * How the body carries a kick (Gavagan and Sayers 2017 phases; kickboxing
 * research of #3201): the support foot pivots on its ball with the heel
 * raised, the pelvis turns over into the kick, the root travels over the
 * support foot, and the whole body tilts away from the target about the
 * support hip, which is what raises the kicking hip so the leg reaches a
 * high target inside the hip's range of motion.
 *
 * The turn, the tilt and the travel rise on one minimum-jerk profile to the
 * chamber key and fall on another from the contact to the replant. A step-up
 * of the support foot slides on its own clock between the launch and the
 * chamber key, and the root rides it.
 */
export namespace KickCarriage {
  /** What a kick's carriage is built from. */
  export interface IProps {
    /** The kicking body. */
    body: IHumanBody;

    /** The posture the kick starts from. */
    entry: IHumanPosture;

    /** The feet the kick starts on. */
    feet: Record<"left" | "right", HumanFoot.IPlacement>;

    /** The kicking side. */
    side: "left" | "right";

    /** The horizontal unit line toward the target. */
    line: IAutoMovieVector3;

    /** The kick's timing. */
    timing: IKickGeometry.ITiming;

    /** The skill's range share: how much of the support foot's pivot is shown. */
    amplitude: number;
  }

  /**
   * The body's posture without the kicking leg's goal.
   *
   * @param props The kick's body, entry, feet, side, line and timing.
   * @param carriage The carriage shown in full between the chamber key and the contact.
   * @param seconds Seconds since the kick's start: the clock of the support foot's step.
   * @param turning The second the turn, tilt and travel are read at; `seconds` when absent.
   * @returns The posture, lowered until the planted support leg reaches its foot; the kicking leg holds its entry foot, unplanted.
   */
  export function posture(
    props: IProps,
    carriage: IKickGeometry.ICarriage,
    seconds: number,
    turning: number = seconds,
  ): IHumanPosture {
    const { body, entry, feet, side, line, timing } = props;
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const w: number =
      minimumJerk(turning / timing.chamber).s -
      minimumJerk(
        (turning - timing.impact) / (timing.duration - timing.impact),
      ).s;
    const stepped: number =
      carriage.step *
      minimumJerk(
        (seconds - timing.prep) / Math.max(1e-3, timing.chamber - timing.prep),
      ).s;

    // The root travels toward the support ankle and rides the step.
    const centre: IAutoMovieVector3 = Vector3.add(
      Vector3.lerp(
        { ...entry.root, y: 0 },
        { x: feet[support].ankle.x, y: 0, z: feet[support].ankle.z },
        KickForm.CENTRE_SHARE * w,
      ),
      Vector3.scale(line, stepped),
    );

    // The support foot turns with the pelvis (at most the pivot's own
    // range), so the support hip's twist stays where the stance had it.
    const supportFoot: HumanFoot.IPlacement = StrikingTarget.pivot(
      body,
      support,
      StrikingTarget.slide(feet[support], line, stepped, 0),
      Math.sign(carriage.turn) *
        Math.min(
          Math.abs(carriage.turn),
          KickForm.PIVOT.turn * props.amplitude,
        ) *
        w,
      KickForm.PIVOT.raise * w,
    );
    const flat: IHumanPosture = {
      root: { x: centre.x, y: entry.root.y, z: centre.z },
      yaw: entry.yaw + carriage.turn * w,
      pitch: entry.pitch + carriage.pitch * w,
      roll: entry.roll,
      joints: { ...entry.joints, ...StrikingStance.joints() },
      limbs: {},
    };
    const tilted: IHumanPosture =
      carriage.lean * w === 0
        ? flat
        : tilt(body, flat, support, Vector3.cross(line, up), carriage.lean * w);
    return resolveHumanPosture.lower(
      body,
      {
        ...tilted,
        limbs: StrikingStance.legs(
          body,
          side === "left"
            ? { left: feet.left, right: supportFoot }
            : { left: supportFoot, right: feet.right },
          { left: side !== "left", right: side !== "right" },
        ),
      },
      5,
    );
  }

  /**
   * A hip joint under a posture's trunk.
   *
   * @param body The body.
   * @param posture The posture; its limbs are not read.
   * @param side The hip's side.
   * @returns The hip joint, world metres.
   */
  export function hip(
    body: IHumanBody,
    posture: IHumanPosture,
    side: "left" | "right",
  ): IAutoMovieVector3 {
    return StrikingBody.trunk(body, posture).get(
      `${side}UpperLeg` as AutoMovieHumanoidBone,
    )!.worldPosition;
  }

  /**
   * Tilt a posture about a world axis through its support hip: the root
   * rotation is turned about the axis, and the root moved so the support hip
   * stays where it was.
   */
  function tilt(
    body: IHumanBody,
    flat: IHumanPosture,
    support: "left" | "right",
    axis: IAutoMovieVector3,
    degrees: number,
  ): IHumanPosture {
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle(axis, degrees),
        resolveHumanPosture.heading(flat),
      ),
    );
    const turned: IHumanPosture = {
      ...flat,
      ...resolveHumanPosture.angles(rotation),
    };
    return {
      ...turned,
      root: Vector3.add(
        turned.root,
        Vector3.subtract(hip(body, flat, support), hip(body, turned, support)),
      ),
    };
  }
}
