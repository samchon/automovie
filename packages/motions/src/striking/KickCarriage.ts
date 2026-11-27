import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "../posture/humanPostureHeading";
import { lowerHumanPosture } from "../posture/internal/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/internal/prepareHumanPostureProjection";
import { KickForm } from "./KickForm";
import { StrikingBody } from "./StrikingBody";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";
import type { strikingStepSupport } from "./internal/strikingStepSupport";

/**
 * How the body carries a kick (Gavagan and Sayers 2017 phases; kickboxing
 * research): the support foot pivots on its ball with the heel raised, the
 * pelvis turns over into the kick, the root travels over the support foot, and
 * the whole body tilts away from the target about the support hip, which is
 * what raises the kicking hip so the leg reaches a high target inside the hip's
 * range of motion.
 *
 * The turn, the tilt, the travel and the rise onto the support leg grow on one
 * minimum-jerk profile to the chamber key and fall on another from the contact
 * to the replant. A step of the support foot (up toward a target out of reach,
 * back from one too close) slides on its own clock between the launch and the
 * chamber key, and the root rides it.
 */
export namespace KickCarriage {
  /** What a kick's carriage is built from. */
  export interface IProps {
    /** The kicking body. */
    body: IAutoMovieMotionHumanBody;

    /** The posture the kick starts from. */
    entry: IAutoMovieMotionHumanPosture;

    /**
     * The entry joints with the fixed fighting hand/neck posture already
     * applied, when prepared by the kick planner.
     */
    joints?: IAutoMovieMotionHumanPosture["joints"];

    /** The feet the kick starts on. */
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;

    /** The kicking side. */
    side: AutoMovieHumanSide;

    /** The horizontal unit line toward the target. */
    line: IAutoMovieVector3;

    /** The kick's timing. */
    timing: IAutoMovieMotionHumanKickGeometry.ITiming;

    /** The skill's range share: how much of the support foot's pivot is shown. */
    amplitude: number;

    /** Pending touchdowns from the cut, completed by the launch. */
    recovery?: strikingStepSupport.ISupport;

    /**
     * How far the entry's support hip stands below its standing height, metres,
     * never negative: the kick rises onto its support leg by this much, so a
     * kick thrown from a sunk stance has the hip height its range was read at.
     */
    rise: number;
  }

  /** The scalar timing driving the three independent carriage motions. */
  export interface IMotion {
    /** Share of the turn, lean and shift onto the support foot. */
    weight: number;

    /** Travel retained after the support foot has stepped, metres. */
    stepped: number;

    /** Travel of the pelvis ahead of the support foot, metres. */
    driven: number;
  }

  /**
   * Read the carriage's three minimum-jerk tracks. The step remains on the
   * original clock when a withdrawal reverses the turn or drive.
   *
   * @param timing The phase boundaries, seconds since launch of the action.
   * @param carriage The step and drive at their full displacements, metres.
   * @param seconds Seconds on the step's clock.
   * @param turning Seconds on the turn and drive's clock.
   * @returns The share of the plate's turn and the two travel displacements.
   */
  export function motion(
    timing: Pick<IAutoMovieMotionHumanKickGeometry.ITiming, "prep" | "chamber" | "impact" | "duration">,
    carriage: Pick<IAutoMovieMotionHumanKickGeometry.ICarriage, "step" | "drive">,
    seconds: number,
    turning: number,
  ): IMotion {
    const recovery: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      (turning - timing.impact) / (timing.duration - timing.impact),
    );
    const weight: number = AutoMovieEngineMotionSampling.minimumJerkShare(turning / timing.chamber) - recovery;
    const stepped: number = carriage.step * AutoMovieEngineMotionSampling.minimumJerkShare(
      (seconds - timing.prep) / Math.max(1e-3, timing.chamber - timing.prep),
    );
    const driven: number = carriage.drive === 0
      ? 0
      : carriage.drive * (AutoMovieEngineMotionSampling.minimumJerkShare(
          (turning - timing.chamber) / Math.max(1e-3, timing.impact - timing.chamber),
        ) - recovery);
    return { weight, stepped, driven };
  }

  /**
   * The body's posture without the kicking leg's goal.
   *
   * @param props The kick's body, entry, feet, side, line and timing.
   * @param carriage The carriage shown in full between the chamber key and the
   *   contact.
   * @param seconds Seconds since the kick's start: the clock of the support
   *   foot's step.
   * @param turning The second the turn, tilt and travel are read at; `seconds`
   *   when absent.
   * @param resolution Optional exact FK workspace borrowed from this
   *   synchronous person's evaluation.
   * @param projection Optional genuine same-body ROM metadata borrowed only
   *   within this synchronous unchanged-table operation.
   * @returns The posture, lowered until the planted support leg reaches its
   *   foot; the kicking leg holds its entry foot, unplanted.
   */
  export function posture(
    props: IProps,
    carriage: IAutoMovieMotionHumanKickGeometry.ICarriage,
    seconds: number,
    turning: number = seconds,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const { body, entry, feet, side, line, timing } = props;
    const support: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const { weight: w, stepped, driven }: IMotion = motion(timing, carriage, seconds, turning);

    // The root travels toward the support ankle and rides the step and the
    // drive.
    const centre: IAutoMovieVector3 = Vector3.add(
      Vector3.lerp(
        { ...entry.root, y: 0 },
        { x: feet[support].ankle.x, y: 0, z: feet[support].ankle.z },
        KickForm.CENTRE_SHARE * w,
      ),
      Vector3.scale(line, stepped + driven),
    );

    // The support foot turns with the pelvis (at most the pivot's own
    // range), so the support hip's twist stays where the stance had it.
    const supportFoot: IAutoMovieMotionHumanFoot.IPlacement =
      StrikingTarget.pivot(
        body,
        support,
        StrikingTarget.slide(
          feet[support],
          line,
          stepped,
          props.recovery?.rise(support, seconds, timing.prep) ?? 0,
        ),
        Math.sign(carriage.turn) *
          Math.min(
            Math.abs(carriage.turn),
            KickForm.PIVOT.turn * props.amplitude,
          ) *
          w,
        KickForm.PIVOT.raise * w,
      );
    const flat: IAutoMovieMotionHumanPosture = {
      root: { x: centre.x, y: entry.root.y + props.rise * w, z: centre.z },
      yaw: entry.yaw + carriage.turn * w,
      pitch: entry.pitch + carriage.pitch * w,
      roll: entry.roll,
      joints: {
        ...StrikingStance.facing(
          props.joints ?? {
            ...entry.joints,
            ...StrikingStance.joints(entry.joints),
          },
          carriage.turn * w,
        ),
        // The support heel rises about the ball and the toes extend by the
        // same angle, so they stay flat on the floor (the forefoot rocker).
        [`${support}Toes`]: [KickForm.PIVOT.raise * w, 0, 0],
      },
      limbs: {},
    };
    const tilted: IAutoMovieMotionHumanPosture =
      carriage.lean * w === 0
        ? flat
        : tilt(
            body,
            flat,
            support,
            Vector3.cross(line, up),
            carriage.lean * w,
            read,
            projection,
          );
    return lowerHumanPosture(
      body,
      {
        ...tilted,
        limbs: StrikingStance.legs(
          body,
          side === "left"
            ? { left: feet.left, right: supportFoot }
            : { left: supportFoot, right: feet.right },
          {
            left:
              side !== "left" &&
              (props.recovery?.landings.left === undefined ||
                seconds >= timing.prep),
            right:
              side !== "right" &&
              (props.recovery?.landings.right === undefined ||
                seconds >= timing.prep),
          },
        ),
      },
      lowerHumanPosture.KNEE,
      read,
    );
  }

  /**
   * A hip joint under a posture's trunk.
   *
   * @param body The body.
   * @param posture The posture; its limbs are not read.
   * @param side The hip's side.
   * @param resolution Optional exact FK workspace borrowed from this
   *   synchronous evaluation.
   * @param projection Optional genuine same-body ROM metadata borrowed only
   *   within this synchronous unchanged-table operation.
   * @returns The hip joint, world metres.
   */
  export function hip(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieVector3 {
    return StrikingBody.trunk(
      body,
      posture,
      resolution,
      HIPS[side],
      projection,
    ).get(`${side}UpperLeg`)!.worldPosition;
  }

  /**
   * Tilt a posture about a world axis through its support hip: the root
   * rotation is turned about the axis, and the root moved so the support hip
   * stays where it was.
   */
  function tilt(
    body: IAutoMovieMotionHumanBody,
    flat: IAutoMovieMotionHumanPosture,
    support: AutoMovieHumanSide,
    axis: IAutoMovieVector3,
    degrees: number,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle(axis, degrees),
        humanPostureHeading(flat),
      ),
    );
    const turned: IAutoMovieMotionHumanPosture = {
      ...flat,
      ...humanPostureHeading.angles(rotation),
    };
    return {
      ...turned,
      root: Vector3.add(
        turned.root,
        Vector3.subtract(
          hip(body, flat, support, resolution, projection),
          hip(body, turned, support, resolution, projection),
        ),
      ),
    };
  }
}

/**
 * Immutable requested outputs; each hip query still admits every authored
 * joint.
 */
const HIPS: Readonly<
  Record<AutoMovieHumanSide, ReadonlySet<AutoMovieHumanoidBone>>
> = {
  left: new Set<AutoMovieHumanoidBone>(["leftUpperLeg"]),
  right: new Set<AutoMovieHumanoidBone>(["rightUpperLeg"]),
};
