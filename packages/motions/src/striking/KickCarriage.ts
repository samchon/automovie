import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
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
 * The turn, the tilt, the travel and the rise onto the support leg grow on
 * one minimum-jerk profile to the chamber key and fall on another from the
 * contact to the replant. A step of the support foot (up toward a target out
 * of reach, back from one too close) slides on its own clock between the
 * launch and the chamber key, and the root rides it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States support pivots, root/hip geometry, distinct local clocks, planted contacts and synchronous FK/ROM metadata lifetime.
 * @evidence contracts/development/design.md#principled-representation Canonical body/feet/posture and existing carriage inputs describe physical kinematics without a parallel rig or solved-state flag.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The actual kick planner needs carriage posture and measured hip; native trunk/foot/lowering owners retain the numerical responsibilities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No target, pose, clamp result, success label or sampled time is retained; optional loans share only existing same-body operations.
 */
export namespace KickCarriage {
  /**
   * What a kick's carriage is built from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members define canonical body, entry/feet, side/line, timing and metre/angle parameters for the actual carriage.
   * @evidence contracts/development/design.md#principled-representation Existing authored posture, foot placements, local clocks and measured scalar geometry define the carriage without numerical solver state.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every field is read by posture's root/support-foot/turn/tilt/lowering geometry; candidate goals and fit results stay with the contact planner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Inputs contain actual physical parameters rather than pre-resolved pose flags, baked endpoints or scene-specific identifiers.
   */
  export interface IProps {
    /** The kicking body. */
    body: IAutoMovieMotionHumanBody;

    /** The posture the kick starts from. */
    entry: IAutoMovieMotionHumanPosture;

    /** The entry joints with the fixed fighting hand/neck posture already applied, when prepared by the kick planner. */
    joints?: IAutoMovieMotionHumanPosture["joints"];

    /** The feet the kick starts on. */
    feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>;

    /** The kicking side. */
    side: "left" | "right";

    /** The horizontal unit line toward the target. */
    line: IAutoMovieVector3;

    /** The kick's timing. */
    timing: IAutoMovieMotionHumanKickGeometry.ITiming;

    /** The skill's range share: how much of the support foot's pivot is shown. */
    amplitude: number;

    /**
     * How far the entry's support hip stands below its standing height,
     * metres, never negative: the kick rises onto its support leg by this
     * much, so a kick thrown from a sunk stance has the hip height its range
     * was read at.
     */
    rise: number;
  }

  /**
   * The body's posture without the kicking leg's goal.
   *
   * @param props The kick's body, entry, feet, side, line and timing.
   * @param carriage The carriage shown in full between the chamber key and the contact.
   * @param seconds Seconds since the kick's start: the clock of the support foot's step.
   * @param turning The second the turn, tilt and travel are read at; `seconds` when absent.
   * @param resolution Optional exact FK workspace borrowed from this synchronous person's evaluation.
   * @param projection Optional genuine same-body ROM metadata borrowed only within this synchronous unchanged-table operation.
   * @returns The posture, lowered until the planted support leg reaches its foot; the kicking leg holds its entry foot, unplanted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States local support/turn clocks, actual carriage, planted support and current-body metadata lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves the original minimum-jerk pelvis/support step, support-foot pivot, support-hip-preserving lean and two-leg lowering geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Root/support-foot geometry feeds flat pose, optional tilt and unchanged lower owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All original coefficients, authored joints, body motion, foot plants/MTP offsets and raw lowering operations remain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Original kinematic and native hip work remains; a caller's genuine current ROM mapper avoids repeated index setup across the two actual tilt hip reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only exact FK prerequisites and genuine same-body unchanged-table metadata are borrowed; each flat/tilted pose still runs every original native joint projection.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The current reader/projector and temporary frames end on return or throw; the fresh posture stores no supplier, map, projector or history.
   */
  export function posture(
    props: IProps,
    carriage: IAutoMovieMotionHumanKickGeometry.ICarriage,
    seconds: number,
    turning: number = seconds,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
    const { body, entry, feet, side, line, timing } = props;
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const w: number =
      minimumJerk.share(turning / timing.chamber) -
      minimumJerk.share((turning - timing.impact) / (timing.duration - timing.impact));
    const stepped: number =
      carriage.step *
      minimumJerk.share(
        (seconds - timing.prep) / Math.max(1e-3, timing.chamber - timing.prep),
      );

    // A push kick's pelvis is held back through the chamber and driven along
    // the line into the contact, then drawn back with the recoil.
    const driven: number =
      carriage.drive === 0
        ? 0
        : carriage.drive *
          (minimumJerk.share(
            (turning - timing.chamber) /
              Math.max(1e-3, timing.impact - timing.chamber),
          ) -
            minimumJerk.share(
              (turning - timing.impact) / (timing.duration - timing.impact),
            ));

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
    const supportFoot: IAutoMovieMotionHumanFoot.IPlacement = StrikingTarget.pivot(
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
    const flat: IAutoMovieMotionHumanPosture = {
      root: { x: centre.x, y: entry.root.y + props.rise * w, z: centre.z },
      yaw: entry.yaw + carriage.turn * w,
      pitch: entry.pitch + carriage.pitch * w,
      roll: entry.roll,
      joints: StrikingStance.facing(
        props.joints ?? { ...entry.joints, ...StrikingStance.joints(entry.joints) },
        carriage.turn * w,
      ),
      limbs: {},
    };
    const tilted: IAutoMovieMotionHumanPosture =
      carriage.lean * w === 0
        ? flat
        : tilt(body, flat, support, Vector3.cross(line, up), carriage.lean * w, read, projection);
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
      resolveHumanPosture.KNEE,
      read,
    );
  }

  /**
   * A hip joint under a posture's trunk.
   *
   * @param body The body.
   * @param posture The posture; its limbs are not read.
   * @param side The hip's side.
   * @param resolution Optional exact FK workspace borrowed from this synchronous evaluation.
   * @param projection Optional genuine same-body ROM metadata borrowed only within this synchronous unchanged-table operation.
   * @returns The hip joint, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual body/posture/side, ignored limb goals, world-metre output and synchronous metadata scope.
   * @evidence contracts/development/implementation.md#principled-implementation The canonical trunk owner assembles/clamps all authored joints and digits before actual requested hip FK.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One demanded trunk read returns the actual upper-leg origin.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No native projection, authored joint or actual hip computation is skipped; a projector remains a checked metadata loan.
   * @evidence contracts/development/implementation.md#efficient-algorithms The fixed hip-name demand limits only output ancestry; a same-operation projector shares index setup while all original admission/projection remains.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Search/course callers explicitly fix body and ROM tables within their synchronous operation, while every changed posture/hip is evaluated normally.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No pose/map/reader/projector is retained here; only the actual fresh hip vector escapes its temporary trunk map.
   */
  export function hip(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: "left" | "right",
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieVector3 {
    return StrikingBody.trunk(body, posture, resolution, HIPS[side], projection).get(
      `${side}UpperLeg` as AutoMovieHumanoidBone,
    )!.worldPosition;
  }

  /**
   * Tilt a posture about a world axis through its support hip: the root
   * rotation is turned about the axis, and the root moved so the support hip
   * stays where it was.
   */
  function tilt(
    body: IAutoMovieMotionHumanBody,
    flat: IAutoMovieMotionHumanPosture,
    support: "left" | "right",
    axis: IAutoMovieVector3,
    degrees: number,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle(axis, degrees),
        resolveHumanPosture.heading(flat),
      ),
    );
    const turned: IAutoMovieMotionHumanPosture = {
      ...flat,
      ...resolveHumanPosture.angles(rotation),
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

/** Immutable requested outputs; each hip query still admits every authored joint. */
const HIPS: Readonly<Record<"left" | "right", ReadonlySet<AutoMovieHumanoidBone>>> = {
  left: new Set<AutoMovieHumanoidBone>(["leftUpperLeg"]),
  right: new Set<AutoMovieHumanoidBone>(["rightUpperLeg"]),
};
