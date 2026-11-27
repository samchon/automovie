import { AutoMovieEngineDefaultHumanoidRom, AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupportAim,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../../compose/internal/AutoMovieMotionHumanTrunk";
import { instance } from "../../ensemble/internal/instance";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * An aim kept on a world target from a moving support, every second.
 *
 * A carried plan (`HumanSupportCarry`) keeps its goals on the support, so a
 * line aimed at the start turns and moves with the support while the target
 * stays in the world. The aim re-takes that line at each second: the line from
 * the carried pivot (the eye, the cheek) to the target against the carried
 * line, its turn about the vertical and its rise. The arms' goals turn by the
 * whole turn about the vertical through the root, and the trunk follows them as
 * far as the chest's and the lumbar spine's axial ranges
 * (`AutoMovieEngineDefaultHumanoidRom`) hold, the two sharing it
 * (`AutoMovieMotionHumanTrunk.CHEST`); the rest is the arms', on top of what
 * the presentation already gave them. The rise goes to the arms' goals alone,
 * turned about the horizontal axis through the pivot square to the line. An aim
 * whose arms would present the line further off the trunk's facing than the
 * aim's `arms` at some frame of the act is refused when the act is planned: the
 * performer, or the support, turns first.
 */
export namespace HumanSupportAim {
  /*
   * The correction at a second: the wanted line against the carried one.
   */
  export interface ICorrection {
    /*
     * The turn about the vertical, degrees, positive toward the performer's
     * left.
     */
    yaw: number;

    /*
     * The rise, degrees, positive up.
     */
    pitch: number;
  }

  /*
   * The correction a carry asks of an aim.
   * Parameter carry: The support's carry since the act's start.
   * Parameter aim: The aim.
   * Returns: The yaw and the rise from the carried line to the wanted one.
   */
  export function correction(
    carry: IAutoMovieMotionHumanSupportCarry.ICarry,
    aim: IAutoMovieMotionHumanSupportAim.IAim,
  ): ICorrection {
    const carried: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      carry.turn,
      AutoMovieEngineVector3.subtract(aim.target, aim.pivot),
    );
    const wanted: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
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

  /*
   * A carried posture re-aimed: the arms' goals turned by the correction's yaw
   * about the vertical through the root and raised by its rise about the pivot,
   * the trunk twisted by as much of the yaw as its axial range holds (`taken`).
   * Contact and task-limit offsets stay in the end joint's frame while only the
   * asked world frame turns.
   * Parameter carry: The support's carry since the act's start.
   * Parameter posture: The posture already carried (`HumanSupportCarry.posture`).
   * Parameter aim: The aim.
   * Returns: The re-aimed posture.
   */
  export function posture(
    carry: IAutoMovieMotionHumanSupportCarry.ICarry,
    posture: IAutoMovieMotionHumanPosture,
    aim: IAutoMovieMotionHumanSupportAim.IAim,
  ): IAutoMovieMotionHumanPosture {
    const c: ICorrection = correction(carry, aim);
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const yawed: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(up, c.yaw);
    const about = (
      q: IAutoMovieQuaternion,
      origin: IAutoMovieVector3,
      p: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      AutoMovieEngineVector3.add(
        origin,
        AutoMovieEngineQuaternion.rotateVector(q, AutoMovieEngineVector3.subtract(p, origin)),
      );
    const pivot: IAutoMovieVector3 = about(
      yawed,
      posture.root,
      carry.point(aim.pivot),
    );
    const line: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(aim.target, pivot);
    const across: IAutoMovieVector3 = AutoMovieEngineVector3.cross(line, up);
    const raised: IAutoMovieQuaternion =
      AutoMovieEngineVector3.length(across) === 0
        ? AutoMovieEngineQuaternion.identity()
        : AutoMovieEngineQuaternion.fromAxisAngle(AutoMovieEngineVector3.normalize(across), c.pitch);
    const move = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      about(raised, pivot, about(yawed, posture.root, p));
    const turn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(raised, yawed);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const limb of ["leftArm", "rightArm"] as const) {
      const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[limb];
      if (goal === undefined || goal.on !== undefined) continue;
      limbs[limb] = {
        ...goal,
        point: move(goal.point),
        bend: move(goal.bend),
        ...(goal.rotation === undefined
          ? {}
          : {
              rotation: AutoMovieEngineQuaternion.normalize(
                AutoMovieEngineQuaternion.multiply(turn, goal.rotation),
              ),
            }),
      };
    }
    return {
      ...posture,
      joints: twisted(posture.joints, taken(posture.joints, c.yaw)),
      limbs,
    };
  }

  /*
   * Refuse an aim whose arms would present the line further off the trunk's
   * facing than `aim.arms` at some frame of the act. The presentation gave the
   * arms the line's bearing at the start less the trunk's turn it planned; each
   * frame adds what the trunk cannot take of that frame's correction.
   * Parameter made: The carried posture at a second of the act, before the aim
   * re-takes it.
   * Parameter carry: The support's carry since the act's start, at a second of it.
   * Parameter aim: The aim.
   * Parameter duration: The act's seconds.
   * On `target`, with the arms' angle and their bound,
   * when a frame's arms present past it.
   * When the range-of-motion table gives the chest or the spine
   * no twist.
   */
  export function check(
    made: (seconds: number) => IAutoMovieMotionHumanPosture,
    carry: (seconds: number) => IAutoMovieMotionHumanSupportCarry.ICarry,
    aim: IAutoMovieMotionHumanSupportAim.IAim,
    duration: number,
  ): void {
    const start: IAutoMovieMotionHumanPosture = made(0);
    const planned: number =
      bearing(start.yaw, aim.pivot, aim.target) - turned(made(duration).joints);
    const frames: number = Math.ceil(duration * instance.RATE);
    for (let k: number = 0; k <= frames; k++) {
      const seconds: number = Math.min(duration, k / instance.RATE);
      const yaw: number = correction(carry(seconds), aim).yaw;
      const arms: number = planned + yaw - taken(made(seconds).joints, yaw);
      if (Math.abs(arms) > aim.arms)
        throw new AutoMovieMotionHumanRefusal({
          kind: "reach",
          axis: "target",
          value: arms,
          feasible: {
            kind: "range",
            minimum: -aim.arms,
            maximum: aim.arms,
            unit: "deg",
          },
          reason: `keeping the aim from the moving support asks the arms to present the line ${arms.toFixed(0)} degrees off the trunk's facing at ${seconds.toFixed(2)} s, past the trunk's twist and the arms' ${aim.arms} degrees`,
          fix: "turn the performer or the support toward the target first, or aim for a shorter time",
        });
    }
  }

  /*
   * How much of a yaw the trunk takes on top of its twist: as far as the
   * chest's and the spine's axial ranges hold, each taking its share.
   */
  function taken(
    joints: IAutoMovieMotionHumanPosture["joints"],
    yaw: number,
  ): number {
    const share: number = AutoMovieMotionHumanTrunk.CHEST;
    const chest: IAutoMovieAngleRange = twist("chest");
    const spine: IAutoMovieAngleRange = twist("spine");
    const c: number = joints.chest?.[2] ?? 0;
    const s: number = joints.spine?.[2] ?? 0;
    const most: number = Math.max(
      0,
      Math.min((chest.max - c) / share, (spine.max - s) / (1 - share)),
    );
    const least: number = Math.min(
      0,
      Math.max((chest.min - c) / share, (spine.min - s) / (1 - share)),
    );
    return Math.min(most, Math.max(least, yaw));
  }

  /*
   * The trunk's turn on the pelvis a posture holds, degrees, positive toward
   * the performer's left: the pelvis's, the spine's and the chest's twists.
   */
  function turned(joints: IAutoMovieMotionHumanPosture["joints"]): number {
    return (
      (joints.hips?.[2] ?? 0) +
      (joints.spine?.[2] ?? 0) +
      (joints.chest?.[2] ?? 0)
    );
  }

  /*
   * A target's bearing off a heading on the floor, from a point, degrees,
   * positive toward the performer's left.
   */
  function bearing(
    heading: number,
    from: IAutoMovieVector3,
    target: IAutoMovieVector3,
  ): number {
    const h: number = (heading * Math.PI) / 180;
    const dx: number = target.x - from.x;
    const dz: number = target.z - from.z;
    return (
      (Math.atan2(
        dx * Math.cos(h) - dz * Math.sin(h),
        dx * Math.sin(h) + dz * Math.cos(h),
      ) *
        180) /
      Math.PI
    );
  }
  /*
   * The trunk's joints twisted by a yaw, shared as the trunk's turn shares it.
   */
  function twisted(
    joints: IAutoMovieMotionHumanPosture["joints"],
    yaw: number,
  ): IAutoMovieMotionHumanPosture["joints"] {
    if (yaw === 0) return joints;
    const add = (
      bone: TwistedAddBone,
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

  /*
   * A trunk joint's axial range from the range-of-motion table.
   */
  function twist(bone: TwistBone): IAutoMovieAngleRange {
    const range: IAutoMovieAngleRange | null | undefined =
      AutoMovieEngineDefaultHumanoidRom[bone]?.twist;
    if (range === null || range === undefined)
      throw new Error(`The range-of-motion table gives the ${bone} no twist`);
    return range;
  }
}

/*
 * The alternatives of `TwistBone`'s site.
 */
type TwistBone = "chest" | "spine";

/*
 * The alternatives of `TwistedAddBone`'s site.
 */
type TwistedAddBone = "chest" | "spine";
