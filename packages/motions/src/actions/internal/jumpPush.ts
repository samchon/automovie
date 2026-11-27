import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStandUpright,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import type { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import type { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { jumpPath } from "./jumpPath";
import { jumpPushArms } from "./jumpPushArms";
import { jumpPushEnd } from "./jumpPushEnd";
import { jumpPushPassing } from "./jumpPushPassing";
import { jumpPushRocker } from "./jumpPushRocker";
import * as JumpPushData from "./JumpPushData";

/*
 * Build a jump's push-off.
 * Parameter props: What it is built from.
 * Returns: Its paths.
 */
export function jumpPush(props: jumpPush.IProps): jumpPush.IPush {
  const {
    body,
    entry,
    takeoff,
    reaching,
    support,
    supportHeading,
    supportPitch,
    heel,
    ball,
    upright,
    heading,
    tuck,
    rootAt,
    knee,
  }: jumpPush.IProps = props;
  const P: number = props.push;
  // What an entry rate adds to a push-off path that starts at rest: the
  // rate times this term, whose slope is one at the cut.
  const carry: (t: number) => number = (t: number): number => AutoMovieEngineMotionSampling.carriedRate(P, t);
  const stride: IAutoMovieVector3 = entry.feet[reaching].velocity;
  const spin: IAutoMovieVector3 = entry.feet[reaching].spin;
  const spinRate: number = Math.hypot(spin.x, spin.y, spin.z);
  // A spin below a nanoradian per second has no axis to normalize.
  const spinAxis: IAutoMovieVector3 | undefined =
    spinRate < 1e-9
      ? undefined
      : {
          x: spin.x / spinRate,
          y: spin.y / spinRate,
          z: spin.z / spinRate,
        };
  const reachingTurn: IAutoMovieQuaternion = HumanFoot.rotation(heading, 0);
  const reachingRotation: ReturnType<typeof Quaternion.prepareSlerp> =
    Quaternion.prepareSlerp(entry.feet[reaching].rotation, reachingTurn);
  const spinTurn: ReturnType<typeof Quaternion.prepareAxisAngle> | undefined =
    spinAxis === undefined ? undefined : Quaternion.prepareAxisAngle(spinAxis);
  const reachingPoint: ReturnType<typeof HumanFrame.preparePoint> =
    HumanFrame.preparePoint(heading, tuck);
  // The reaching foot's velocity and spin are one rigid motion, carried for
  // no longer than brings a sole point to the floor: a point `h` above it
  // coming down at `v` affords `h / (PEAK v)` seconds. A point descending
  // slower than 1 cm/s is one the foot was turning about, and is passed.
  let reachingCarry: number = P;
  for (const point of ["heel", "ball"] as const) {
    const arm: IAutoMovieVector3 = Quaternion.rotateVector(
      entry.feet[reaching].rotation,
      HumanFoot.offset(body, reaching, point),
    );
    const falling: number = -(stride.y + spin.z * arm.x - spin.x * arm.z);
    if (falling > JumpPushData.PIVOTING)
      reachingCarry = Math.min(
        reachingCarry,
        Math.max(0, entry.feet[reaching].ankle.y + arm.y) /
          (AutoMovieEngineMotionSampling.carriedRatePeak() * falling),
      );
  }
  // The reaching ankle's entry acceleration fades over the same carry, so
  // the leg continues what the root's carried acceleration asks of it.
  const surge: IAutoMovieVector3 = entry.feet[reaching].acceleration;
  const reachBend: (t: number) => number = (t: number): number =>
    reachingCarry > JumpPushData.CARRY ? AutoMovieEngineMotionSampling.carriedAcceleration(reachingCarry, t) : 0;
  // The take-off foot's pitch rate about its lateral axis, degrees per
  // second, positive lifting the toes.
  const lateral: IAutoMovieVector3 = Quaternion.rotateVector(support.rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  const roll: IAutoMovieVector3 = entry.feet[takeoff].spin;
  const rolling: number =
    (-(roll.x * lateral.x + roll.y * lateral.y + roll.z * lateral.z) * 180) /
    Math.PI;
  // The pelvis joint through the push, from the entry's own angles and
  // their rates to the upright ones. The hip joints hang from the pelvis,
  // so a pelvis listed and turned by a stride puts the take-off hip
  // millimetres from where an upright one has it, and the heel's rule would
  // read a leg the entry does not show.
  const level: readonly [number, number, number] = upright.joints.hips ?? [
    0, 0, 0,
  ];
  const listed: readonly [number, number, number] =
    entry.posture.joints.hips ?? level;
  const listing: readonly [number, number, number] = entry.velocity.joints.get(
    "hips",
  ) ?? [0, 0, 0];
  const pelvisDelta: readonly [number, number, number] = [
    level[0] - listed[0],
    level[1] - listed[1],
    level[2] - listed[2],
  ];
  const fromYaw: number = entry.posture.yaw;
  const yawDelta: number = heading - fromYaw;
  const turning: number = (entry.velocity.angular.y * 180) / Math.PI;
  const sample: (t: number) => jumpPush.IPhase = (
    t: number,
  ): jumpPush.IPhase => {
    const s: number = AutoMovieEngineMotionSampling.minimumJerkShare(t / P);
    const k: number = carry(t);
    return {
      seconds: t,
      root: rootAt(t),
      progress: s,
      carry: k,
      yaw: t >= P ? heading : fromYaw + yawDelta * s + turning * k,
      pelvis:
        t >= P
          ? level
          : [
              listed[0] + pelvisDelta[0] * s + listing[0] * k,
              listed[1] + pelvisDelta[1] * s + listing[1] * k,
              listed[2] + pelvisDelta[2] * s + listing[2] * k,
            ],
    };
  };
  // The push's end, where its heel-rise rule is read once: a posture read
  // holds the push at its end (`jumpPushPosture`), so its root there is
  // the path's at `P`.
  const ended: Pick<IAutoMovieMotionHumanPosture, OfEnd> = jumpPushEnd(
    props,
    rootAt(P),
  );
  const { swinging, armAt, elbowAt }: jumpPushArms.IArms = jumpPushArms({
    entry,
  });

  const {
    lowered,
    heelAt,
    ballAt,
    heelContact,
    ballContact,
    pitchAt,
  }: jumpPushRocker.IRocker = jumpPushRocker({
    body,
    takeoff,
    heel,
    ball,
    supportHeading,
    supportPitch,
    P,
    rolling,
    sample,
    CARRY: JumpPushData.CARRY,
  });

  const passing: jumpPushPassing.Passing = jumpPushPassing({
    body,
    heading,
    reaching,
    support,
  });

  return {
    sample,
    swinging,
    arm: armAt,
    elbow: elbowAt,
    write: (
      phase: jumpPush.IPhase,
      joints: IAutoMovieMotionHumanPosture["joints"],
      limbs: IAutoMovieMotionHumanPosture["limbs"],
      resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    ): void => {
      const t: number = phase.seconds;
      const root: IAutoMovieVector3 = phase.root;
      if (t >= P) {
        Object.assign(joints, ended.joints);
        Object.assign(limbs, ended.limbs);
        return;
      }
      joints.hips = phase.pelvis;
      // Push-off: the take-off foot rolls over its ball; the reaching leg withdraws under the body.
      // From the entry's own pitch and pitch rate, so a foot rolling on
      // its heel or its ball keeps rolling.
      const pitch: number = pitchAt(phase, resolution);
      const about: OfAbout = t < lowered ? "heel" : "mtp";
      const foot: IAutoMovieMotionHumanFoot.IPlacement =
        about === "heel" ? heelAt!(pitch) : ballAt(pitch);
      limbs[`${takeoff}Leg`] = {
        point: foot.ankle,
        rotation: foot.rotation,
        bend: knee(root, takeoff, supportHeading),
        planted: true,
        // The point the foot turns about is the one that stays on the floor.
        contact: (about === "heel" ? heelContact! : ballContact)(0),
      };
      joints[`${takeoff}Toes`] = [-pitch, 0, 0];
      // The reaching foot leaves at once on a minimum-jerk path, carrying
      // the velocity and the spin it was entered with.
      const s: number = phase.progress;
      const k: number =
        reachingCarry > JumpPushData.CARRY
          ? reachingCarry === P
            ? phase.carry
            : AutoMovieEngineMotionSampling.carriedRate(reachingCarry, t)
          : 0;
      const b: number = reachBend(t);
      const from: IAutoMovieVector3 = entry.feet[reaching].ankle;
      const into: IAutoMovieVector3 = reachingPoint(root);
      const path: IAutoMovieVector3 = Vector3.add(
        jumpPath.lerp(from, into, s),
        passing(from, into, s),
      );
      const turned: IAutoMovieQuaternion = reachingRotation(s);
      limbs[`${reaching}Leg`] = {
        point: {
          x: path.x + stride.x * k + surge.x * b,
          y: path.y + stride.y * k + surge.y * b,
          z: path.z + stride.z * k + surge.z * b,
        },
        rotation:
          spinTurn === undefined
            ? turned
            : Quaternion.normalize(
                Quaternion.multiply(
                  spinTurn((spinRate * k * 180) / Math.PI),
                  turned,
                ),
              ),
        bend: knee(root, reaching, heading),
      };
    },
  };
}

/*
 * A jump's push-off, from the entry exactly: the pelvis and the heading from
 * the entry's own angles and rates to the jump's, the take-off foot laid flat
 * about its heel if it was on its heel rocker and then risen about its toes'
 * joint by the rule a walking stance rises by, and the reaching leg withdrawn
 * under the body carrying the velocity, spin and acceleration it was entered
 * with, each rate for no longer than its room affords (`jump` states the law).
 */
export namespace jumpPush {
  /*
   * The heel rise the push asks of the take-off foot about its ball, degrees
   * (provisional); the ankle's reach rule may steepen it.
   */
  export const HEEL: number = 40;

  /*
   * The hip a planted leg stands from at an asked pitch: the push's own hip,
   * lowered along gravity as the posture's lowering lowers it to reach that
   * pitch's ankle (`lowerHumanPosture`, the planted leg's least knee bend
   * `lowerHumanPosture.KNEE`). The heel rule is a stance's, and read at an
   * unlowered hip beyond the leg's reach it has no lean to read: a gate that
   * kept the asked pitch there and the rule's pitch within reach switched
   * between the two where the hip crossed the reach, a 5 degree step of the
   * long jump's take-off foot 0.09 s into its push. Read at the hip the leg
   * stands from, the asked ankle is always within reach and the rule is
   * continuous through the push.
   * Parameter hip: The push's unlowered take-off hip joint, world metres.
   * Parameter ankle: The take-off ankle at the asked pitch, world metres.
   * Parameter short: The lowering one leg asks of the root at the least knee bend
   * (`lowerHumanPosture.prepareShort`).
   * Returns: The hip the leg stands from, world metres, or undefined for an
   * ankle horizontally beyond the leg's reach, which no lowering helps.
   */
  export function standing(
    hip: IAutoMovieVector3,
    ankle: IAutoMovieVector3,
    short: ReturnType<typeof lowerHumanPosture.prepareShort>,
  ): IAutoMovieVector3 | undefined {
    const drop: number = short(hip, ankle);
    if (drop === -Infinity) return undefined;
    return drop > 0 ? { ...hip, y: hip.y - drop } : hip;
  }

  /*
   * What the push-off is built from.
   */
  export interface IProps {
    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The fixed entry snapshot supplying this push's initial values and rates.
     */
    entry: IAutoMovieMotionHumanEntryState;

    /*
     * The foot that pushes off.
     */
    takeoff: AutoMovieHumanSide;

    /*
     * The foot that leaves at once.
     */
    reaching: AutoMovieHumanSide;

    /*
     * The take-off foot as entered.
     */
    support: IAutoMovieMotionHumanFoot.IPlacement;

    /*
     * The take-off foot's heading, degrees.
     */
    supportHeading: number;

    /*
     * The take-off foot's pitch as entered, degrees; positive with the toes up.
     */
    supportPitch: number;

    /*
     * The take-off foot's heel, world metres.
     */
    heel: IAutoMovieVector3;

    /*
     * The take-off foot's toes' joint once flat, world metres.
     */
    ball: IAutoMovieVector3;

    /*
     * The upright stand the pelvis comes to.
     */
    upright: IAutoMovieMotionHumanStandUpright.IAlignment;

    /*
     * The jump's heading, degrees.
     */
    heading: number;

    /*
     * The push-off's seconds.
     */
    push: number;

    /*
     * Where the reaching ankle is drawn to in the body's frame, metres.
     */
    tuck: IAutoMovieVector3;

    /*
     * The raw push Hermite root at local seconds, held at its endpoints.
     */
    rootAt: (t: number) => IAutoMovieVector3;

    /*
     * The knee's bend point for a root, a side and a heading.
     */
    knee: (
      root: IAutoMovieVector3,
      side: AutoMovieHumanSide,
      yaw: number,
    ) => IAutoMovieVector3;
  }

  /*
   * The push-off's paths.
   */
  export interface IPush {
    /*
     * Read one unlowered phase sample at local push seconds.
     */
    sample: (t: number) => IPhase;

    /*
     * An upper arm's entry flexion rate, degrees per second.
     */
    swinging: (side: AutoMovieHumanSide) => number;

    /*
     * The upper-arm flexion at one current push sample, clinical degrees.
     */
    arm: (phase: IPhase, side: AutoMovieHumanSide) => number;

    /*
     * How far an elbow stands from the jump's own elbow rule at one push
     * sample, clinical degrees: the run's bent elbow is carried out like its
     * shoulder, fading from its entered gap and gap rate to none at the
     * take-off, so the elbow is not straightened ahead of the arm swing.
     */
    elbow: (phase: IPhase, side: AutoMovieHumanSide) => number;

    /*
     * Write the pelvis, both legs and toes at a local push second.
     */
    write: (
      phase: IPhase,
      joints: Partial<
        Record<AutoMovieHumanoidBone, readonly [number, number, number]>
      >,
      limbs: IAutoMovieMotionHumanPosture["limbs"],
      resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    ) => void;
  }

  /*
   * One raw push instant shared by its arm, pelvis, rocker and posture writers.
   */
  export interface IPhase {
    /*
     * Local elapsed push seconds.
     */
    seconds: number;

    /*
     * The original unlowered Hermite root, world metres.
     */
    root: IAutoMovieVector3;

    /*
     * The existing minimum-jerk progress at these seconds, unitless.
     */
    progress: number;

    /*
     * The existing carried entry-rate coefficient, seconds per unit rate.
     */
    carry: number;

    /*
     * The entered heading continued toward the jump heading, degrees.
     */
    yaw: number;

    /*
     * The entered pelvis continued toward upright, clinical degrees.
     */
    pelvis: readonly [number, number, number];
  }
}

/*
 * The alternatives of `OfAbout`'s site.
 */
type OfAbout = "heel" | "mtp";

/*
 * The alternatives of `OfEnd`'s site.
 */
type OfEnd = "joints" | "limbs";
