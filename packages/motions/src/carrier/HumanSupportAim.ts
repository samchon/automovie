import { DEFAULT_HUMANOID_ROM, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { instance } from "../ensemble/instance";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { HumanSupportCarry } from "./HumanSupportCarry";

/**
 * An aim kept on a world target from a moving support, every second (#3491).
 *
 * A carried plan (`HumanSupportCarry`) keeps its goals on the support, so a
 * line aimed at the start turns and moves with the support while the target
 * stays in the world. The aim re-takes that line at each second: the line
 * from the carried pivot (the eye, the cheek) to the target against the
 * carried line, its turn about the vertical and its rise. The turn goes to
 * the trunk, which twists on the pelvis, the chest and the lumbar spine
 * sharing it (`AutoMovieMotionHumanTrunk.CHEST`), and the arms' goals turn
 * with it about the vertical through the root; the rise goes to the arms'
 * goals alone, turned about the horizontal axis through the pivot square to
 * the line. A twist the chest's or the spine's axial range
 * (`DEFAULT_HUMANOID_ROM`) cannot hold at some frame of the act is refused
 * when the act is planned: the performer, or the support, turns first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is re-taken, which parts take the turn and the rise, and when it is refused.
 * @evidence contracts/development/design.md#principled-representation The aim is a world target and the pivot the line was planned from; the correction is the yaw and the rise between the carried and the wanted lines.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The aim record, the correction, the corrected posture and the planning check; read by `HumanSupportCarry.plan`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The trunk's bound is the range-of-motion table's, never a typed angle; the frames checked are the film's (`instance.RATE`).
 */
export namespace HumanSupportAim {
  /**
   * A line kept on a world target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame.
   * @evidence contracts/development/design.md#principled-representation Two world points at the act's start.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain points.
   */
  export interface IAim {
    /** The target, world metres; it stays in the world. */
    target: IAutoMovieVector3;

    /** Where the line was planned from at the start (the eye, the cheek), world metres; it rides the support. */
    pivot: IAutoMovieVector3;
  }

  /**
   * The correction at a second: the wanted line against the carried one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and sign.
   * @evidence contracts/development/design.md#principled-representation A yaw and a rise.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Degrees.
   */
  export interface ICorrection {
    /** The turn about the vertical, degrees, positive toward the performer's left. */
    yaw: number;

    /** The rise, degrees, positive up. */
    pitch: number;
  }

  /**
   * The correction a carry asks of an aim.
   *
   * @param carry The support's carry since the act's start.
   * @param aim The aim.
   * @returns The yaw and the rise from the carried line to the wanted one.
   */
  export function correction(
    carry: HumanSupportCarry.ICarry,
    aim: IAim,
  ): ICorrection {
    const carried: IAutoMovieVector3 = Quaternion.rotateVector(
      carry.turn,
      Vector3.subtract(aim.target, aim.pivot),
    );
    const wanted: IAutoMovieVector3 = Vector3.subtract(
      aim.target,
      carry.point(aim.pivot),
    );
    const yaw = (v: IAutoMovieVector3): number =>
      (Math.atan2(v.x, v.z) * 180) / Math.PI;
    const rise = (v: IAutoMovieVector3): number =>
      (Math.atan2(v.y, Math.hypot(v.x, v.z)) * 180) / Math.PI;
    const turn: number = yaw(wanted) - yaw(carried);
    return {
      yaw: turn - 360 * Math.round(turn / 360),
      pitch: rise(wanted) - rise(carried),
    };
  }

  /**
   * A carried posture re-aimed: the trunk twisted by the correction's yaw,
   * the arms' goals turned with it about the vertical through the root and
   * raised by its rise about the pivot. Contact and task-limit offsets stay
   * in the end joint's frame while only the asked world frame turns.
   *
   * @param carry The support's carry since the act's start.
   * @param posture The posture already carried (`HumanSupportCarry.posture`).
   * @param aim The aim.
   * @returns The re-aimed posture.
   */
  export function posture(
    carry: HumanSupportCarry.ICarry,
    posture: IHumanPosture,
    aim: IAim,
  ): IHumanPosture {
    const c: ICorrection = correction(carry, aim);
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const yawed: IAutoMovieQuaternion = Quaternion.fromAxisAngle(up, c.yaw);
    const about = (
      q: IAutoMovieQuaternion,
      origin: IAutoMovieVector3,
      p: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(
        origin,
        Quaternion.rotateVector(q, Vector3.subtract(p, origin)),
      );
    const pivot: IAutoMovieVector3 = about(
      yawed,
      posture.root,
      carry.point(aim.pivot),
    );
    const line: IAutoMovieVector3 = Vector3.subtract(aim.target, pivot);
    const across: IAutoMovieVector3 = Vector3.cross(line, up);
    const raised: IAutoMovieQuaternion =
      Vector3.length(across) === 0
        ? Quaternion.identity()
        : Quaternion.fromAxisAngle(Vector3.normalize(across), c.pitch);
    const move = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      about(raised, pivot, about(yawed, posture.root, p));
    const turn: IAutoMovieQuaternion = Quaternion.multiply(raised, yawed);
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    for (const limb of ["leftArm", "rightArm"] as const) {
      const goal: IHumanPosture.IGoal | undefined = posture.limbs[limb];
      if (goal === undefined || goal.on !== undefined) continue;
      limbs[limb] = {
        ...goal,
        point: move(goal.point),
        bend: move(goal.bend),
        ...(goal.rotation === undefined
          ? {}
          : {
              rotation: Quaternion.normalize(
                Quaternion.multiply(turn, goal.rotation),
              ),
            }),
      };
    }
    return { ...posture, joints: twisted(posture.joints, c.yaw), limbs };
  }

  /**
   * Refuse an aim whose trunk twist leaves the chest's or the spine's axial
   * range at some frame of the act.
   *
   * @param posture The re-aimed posture at a second of the act.
   * @param duration The act's seconds.
   * @throws {HumanRefusal} On `target`, with the frame's twist and the range, when a frame's twist leaves its range.
   * @throws {Error} When the range-of-motion table gives the chest or the spine no twist.
   */
  export function check(
    posture: (seconds: number) => IHumanPosture,
    duration: number,
  ): void {
    const frames: number = Math.ceil(duration * instance.RATE);
    for (let k: number = 0; k <= frames; k++) {
      const seconds: number = Math.min(duration, k / instance.RATE);
      const joints: IHumanPosture["joints"] = posture(seconds).joints;
      for (const bone of ["chest", "spine"] as const) {
        const range: IAutoMovieAngleRange = twist(bone);
        const value: number = joints[bone]?.[2] ?? 0;
        if (value < range.min || value > range.max)
          throw new HumanRefusal({
            kind: "reach",
            axis: "target",
            value,
            feasible: {
              kind: "range",
              minimum: range.min,
              maximum: range.max,
              unit: "deg",
            },
            reason: `keeping the aim from the moving support twists the ${bone} ${value.toFixed(0)} degrees at ${seconds.toFixed(2)} s, outside its ${range.min} to ${range.max} degrees`,
            fix: "turn the performer or the support toward the target first, or aim for a shorter time",
          });
      }
    }
  }

  /** The trunk's joints twisted by a yaw, shared as the trunk's turn shares it. */
  function twisted(
    joints: IHumanPosture["joints"],
    yaw: number,
  ): IHumanPosture["joints"] {
    if (yaw === 0) return joints;
    const add = (
      bone: "chest" | "spine",
      share: number,
    ): [number, number, number] => {
      const at: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      return [at[0], at[1], at[2] + share * yaw];
    };
    return {
      ...joints,
      chest: add("chest", AutoMovieMotionHumanTrunk.CHEST),
      spine: add("spine", 1 - AutoMovieMotionHumanTrunk.CHEST),
    };
  }

  /** A trunk joint's axial range from the range-of-motion table. */
  function twist(bone: "chest" | "spine"): IAutoMovieAngleRange {
    const range: IAutoMovieAngleRange | null | undefined =
      DEFAULT_HUMANOID_ROM[bone]?.twist;
    if (range === null || range === undefined)
      throw new Error(`The range-of-motion table gives the ${bone} no twist`);
    return range;
  }
}
