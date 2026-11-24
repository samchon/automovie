import {
  Quaternion,
  Vector3,
  carriedAcceleration,
  carriedRate,
  minimumJerk,
} from "@automovie/engine";
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

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { jumpJoints } from "./jumpJoints";
import { jumpPath } from "./jumpPath";
import { jumpPushEnd } from "./jumpPushEnd";
import { stand } from "./stand";
import { walkLeg } from "./walkLeg";

/**
 * The slowest descent of a reaching-foot sole point that counts as falling,
 * metres per second: slower, the foot is turning about that point
 * (provisional).
 */
const PIVOTING: number = 0.01;

/**
 * The shortest carry, seconds, whose carried-rate term is evaluated: a
 * microsecond carry adds nothing a frame shows, and the term divides by its
 * duration.
 */
const CARRY: number = 1e-6;

/** The finite-difference step of the heel rule's slope, seconds. */
const STEP: number = 1e-3;

/**
 * The least forward gap that reads as one foot ahead of the other, metres: a
 * nanometre, the walk's root-solve width (`walkReach`), under which the gap is
 * a rounding of side by side.
 */
const PASS_GAP: number = 1e-9;
/** The alternatives of `OfAbout`'s site. */
type OfAbout = "heel" | "mtp";

/** The alternatives of `OfEnd`'s site. */
type OfEnd = "joints" | "limbs";

/** The record of `IOfEdgeResult`'s site. */
type IOfEdgeResult = {
  met: number;
  excess: number;
};

/** The record of `IOfEdge`'s site. */
type IOfEdge = { met: number; excess: number };

/**
 * A jump's push-off, from the entry exactly: the pelvis and the heading from
 * the entry's own angles and rates to the jump's, the take-off foot laid flat
 * about its heel if it was on its heel rocker and then risen about its toes'
 * joint by the rule a walking stance rises by, and the reaching leg withdrawn
 * under the body carrying the velocity, spin and acceleration it was entered
 * with, each rate for no longer than its room affords (`jump` states the law).
 */
export namespace jumpPush {
  /**
   * The heel rise the push asks of the take-off foot about its ball, degrees
   * (provisional); the ankle's reach rule may steepen it.
   */
  export const HEEL: number = 40;

  /**
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
   *
   * @param hip The push's unlowered take-off hip joint, world metres.
   * @param ankle The take-off ankle at the asked pitch, world metres.
   * @param short The lowering one leg asks of the root at the least knee bend
   *   (`lowerHumanPosture.prepareShort`).
   * @returns The hip the leg stands from, world metres, or undefined for an
   *   ankle horizontally beyond the leg's reach, which no lowering helps.
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

  /** What the push-off is built from. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The fixed entry snapshot supplying this push's initial values and rates. */
    entry: IAutoMovieMotionHumanEntryState;

    /** The foot that pushes off. */
    takeoff: AutoMovieHumanSide;

    /** The foot that leaves at once. */
    reaching: AutoMovieHumanSide;

    /** The take-off foot as entered. */
    support: IAutoMovieMotionHumanFoot.IPlacement;

    /** The take-off foot's heading, degrees. */
    supportHeading: number;

    /** The take-off foot's pitch as entered, degrees; positive with the toes up. */
    supportPitch: number;

    /** The take-off foot's heel, world metres. */
    heel: IAutoMovieVector3;

    /** The take-off foot's toes' joint once flat, world metres. */
    ball: IAutoMovieVector3;

    /** The upright stand the pelvis comes to. */
    upright: IAutoMovieMotionHumanStandUpright.IAlignment;

    /** The jump's heading, degrees. */
    heading: number;

    /** The push-off's seconds. */
    push: number;

    /** Where the reaching ankle is drawn to in the body's frame, metres. */
    tuck: IAutoMovieVector3;

    /** The raw push Hermite root at local seconds, held at its endpoints. */
    rootAt: (t: number) => IAutoMovieVector3;

    /** The knee's bend point for a root, a side and a heading. */
    knee: (
      root: IAutoMovieVector3,
      side: AutoMovieHumanSide,
      yaw: number,
    ) => IAutoMovieVector3;
  }

  /** The push-off's paths. */
  export interface IPush {
    /** Read one unlowered phase sample at local push seconds. */
    sample: (t: number) => IPhase;

    /** An upper arm's entry flexion rate, degrees per second. */
    swinging: (side: AutoMovieHumanSide) => number;

    /** The upper-arm flexion at one current push sample, clinical degrees. */
    arm: (phase: IPhase, side: AutoMovieHumanSide) => number;

    /**
     * How far an elbow stands from the jump's own elbow rule at one push
     * sample, clinical degrees: the run's bent elbow is carried out like its
     * shoulder, fading from its entered gap and gap rate to none at the
     * take-off, so the elbow is not straightened ahead of the arm swing.
     */
    elbow: (phase: IPhase, side: AutoMovieHumanSide) => number;

    /** Write the pelvis, both legs and toes at a local push second. */
    write: (
      phase: IPhase,
      joints: Partial<
        Record<AutoMovieHumanoidBone, readonly [number, number, number]>
      >,
      limbs: IAutoMovieMotionHumanPosture["limbs"],
      resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    ) => void;
  }

  /** One raw push instant shared by its arm, pelvis, rocker and posture writers. */
  export interface IPhase {
    /** Local elapsed push seconds. */
    seconds: number;

    /** The original unlowered Hermite root, world metres. */
    root: IAutoMovieVector3;

    /** The existing minimum-jerk progress at these seconds, unitless. */
    progress: number;

    /** The existing carried entry-rate coefficient, seconds per unit rate. */
    carry: number;

    /** The entered heading continued toward the jump heading, degrees. */
    yaw: number;

    /** The entered pelvis continued toward upright, clinical degrees. */
    pelvis: readonly [number, number, number];
  }

  /**
   * Build a jump's push-off.
   *
   * @param props What it is built from.
   * @returns Its paths.
   */
  export function of(props: IProps): IPush {
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
    }: IProps = props;
    const P: number = props.push;
    // What an entry rate adds to a push-off path that starts at rest: the
    // rate times this term, whose slope is one at the cut.
    const carry: (t: number) => number = (t: number): number =>
      carriedRate(P, t);
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
      spinAxis === undefined
        ? undefined
        : Quaternion.prepareAxisAngle(spinAxis);
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
      if (falling > PIVOTING)
        reachingCarry = Math.min(
          reachingCarry,
          Math.max(0, entry.feet[reaching].ankle.y + arm.y) /
            (carriedRate.PEAK * falling),
        );
    }
    // The reaching ankle's entry acceleration fades over the same carry, so
    // the leg continues what the root's carried acceleration asks of it.
    const surge: IAutoMovieVector3 = entry.feet[reaching].acceleration;
    const reachBend: (t: number) => number = (t: number): number =>
      reachingCarry > CARRY ? carriedAcceleration(reachingCarry, t) : 0;
    // The take-off foot's pitch rate about its lateral axis, degrees per
    // second, positive lifting the toes.
    const lateral: IAutoMovieVector3 = Quaternion.rotateVector(
      support.rotation,
      { x: 1, y: 0, z: 0 },
    );
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
    const listing: readonly [number, number, number] =
      entry.velocity.joints.get("hips") ?? [0, 0, 0];
    const pelvisDelta: readonly [number, number, number] = [
      level[0] - listed[0],
      level[1] - listed[1],
      level[2] - listed[2],
    ];
    const fromYaw: number = entry.posture.yaw;
    const yawDelta: number = heading - fromYaw;
    const turning: number = (entry.velocity.angular.y * 180) / Math.PI;
    const sample: (t: number) => IPhase = (t: number): IPhase => {
      const s: number = minimumJerk.share(t / P);
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
    const prepareArm: (side: AutoMovieHumanSide) => IArmTrack = (
      side: AutoMovieHumanSide,
    ): IArmTrack => {
      const from: number = entry.posture.joints[`${side}UpperArm`]?.[0] ?? 0;
      const rate: number =
        entry.velocity.joints.get(`${side}UpperArm`)?.[0] ?? 0;
      // The jump's elbow rule is the relaxed elbow plus a third of the
      // shoulder's flexion (`jumpJoints.SHOULDER_PER_ELBOW`); the entered
      // elbow's gap from it, and that gap's rate, are what the push fades.
      const ruled: number = stand.ELBOW + from / jumpJoints.SHOULDER_PER_ELBOW;
      const elbow: number | undefined =
        entry.posture.joints[`${side}LowerArm`]?.[0];
      return {
        from,
        delta: jumpJoints.TAKEOFF - from,
        rate,
        bend: elbow === undefined ? 0 : elbow - ruled,
        bending:
          elbow === undefined
            ? 0
            : (entry.velocity.joints.get(`${side}LowerArm`)?.[0] ?? 0) -
              rate / jumpJoints.SHOULDER_PER_ELBOW,
      };
    };
    const arms: Record<AutoMovieHumanSide, IArmTrack> = {
      left: prepareArm("left"),
      right: prepareArm("right"),
    };
    const swinging: (side: AutoMovieHumanSide) => number = (
      side: AutoMovieHumanSide,
    ): number => arms[side].rate;
    const armAt: IPush["arm"] = (
      phase: IPhase,
      side: AutoMovieHumanSide,
    ): number => {
      const track: IArmTrack = arms[side];
      return (
        track.from + track.delta * phase.progress + track.rate * phase.carry
      );
    };
    const elbowAt: IPush["elbow"] = (
      phase: IPhase,
      side: AutoMovieHumanSide,
    ): number => {
      const track: IArmTrack = arms[side];
      return track.bend * (1 - phase.progress) + track.bending * phase.carry;
    };

    // A foot entered on its heel rocker is laid flat before its heel rises,
    // as a walking foot is (Perry and Burnfield), so the pivot passes from
    // the heel to the toes' joint with the foot at rest: passed at a rate,
    // the ankle's velocity would step by that rate times the foot's length.
    // The foot comes flat in the share of the push its pitch is of the whole
    // turn, and no later than keeps a foot entered rolling down above the
    // floor: toward the end the carried rate's term falls as four times the
    // cube of the time left and the pitch as ten times it.
    const lowered: number =
      supportPitch > 0
        ? Math.min(
            (P * supportPitch) / (supportPitch + HEEL),
            rolling < 0 ? (2.5 * supportPitch) / -rolling : P,
          )
        : 0;
    const span: number = P - lowered;
    const start: number = Math.min(supportPitch, 0);
    const heelAt: ReturnType<typeof HumanFoot.preparePivot> | undefined =
      lowered > 0
        ? HumanFoot.preparePivot(body, takeoff, "heel", heel, supportHeading)
        : undefined;
    const ballAt: ReturnType<typeof HumanFoot.preparePivot> =
      HumanFoot.preparePivot(body, takeoff, "mtp", ball, supportHeading);
    const heelContact: ReturnType<typeof HumanFoot.prepareOffset> | undefined =
      lowered > 0 ? HumanFoot.prepareOffset(body, takeoff, "heel") : undefined;
    const ballContact: ReturnType<typeof HumanFoot.prepareOffset> =
      HumanFoot.prepareOffset(body, takeoff, "mtp");
    const heelRise: ReturnType<typeof walkLeg.prepareHeelRise> =
      walkLeg.prepareHeelRise(
        body,
        takeoff,
        ball,
        supportHeading,
        walkLeg.ROCKER,
      );
    // The flat foot's heel then rises by the rule a walking stance rises by:
    // asked from flat to its take-off pitch, and no later than the ankle's
    // dorsal limit asks. A foot the walk held by that rule is met by it.
    // The rule reads the hip the planted leg stands from (`standing`).
    const short: ReturnType<typeof lowerHumanPosture.prepareShort> =
      lowerHumanPosture.prepareShort(body, lowerHumanPosture.KNEE);
    const ruled: (
      phase: IPhase,
      resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    ) => number = (
      phase: IPhase,
      resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    ): number => {
      const hip: IAutoMovieVector3 = hipJoints(
        body,
        phase.root,
        humanPostureHeading({ yaw: phase.yaw, pitch: 0, roll: 0 }),
        phase.pelvis,
        resolution?.(),
      )[takeoff];
      const asked: number =
        Math.min(start, -HEEL) *
        minimumJerk.share((phase.seconds - lowered) / span);
      const stood: IAutoMovieVector3 | undefined = standing(
        hip,
        ballAt(asked).ankle,
        short,
      );
      return stood === undefined ? asked : heelRise(stood, asked);
    };
    // What the entry's pitch and pitch rate differ from the rule's by is
    // eased out over the rise. A heel coming down about the ball is carried
    // no longer than lays the foot flat, where the pivot would pass to the
    // heel. The rule's slope at the rise's start is its second-order
    // one-sided difference over two steps of `STEP` seconds, whose O(STEP^2)
    // error is far below a degree per second for a rule that changes over
    // the push's tenths of a second.
    const edge: IOfEdge = ((): IOfEdgeResult => {
      const read: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const met: number = ruled(sample(lowered), read);
      const excess: number =
        (supportPitch > 0 ? 0 : rolling) -
        (-3 * met +
          4 * ruled(sample(lowered + STEP), read) -
          ruled(sample(lowered + 2 * STEP), read)) /
          (2 * STEP);
      return { met, excess };
    })();
    const gap: number = start - edge.met;
    const excess: number = edge.excess;
    const carried: number =
      excess > 0 ? Math.min(span, -start / (carriedRate.PEAK * excess)) : span;
    const pitchAt: (
      phase: IPhase,
      resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    ) => number = (
      phase: IPhase,
      resolution?: ReturnType<typeof prepareHumanPoseResolution>,
    ): number => {
      const t: number = phase.seconds;
      return t < lowered
        ? supportPitch * (1 - minimumJerk.share(t / lowered)) +
            rolling * carriedRate(lowered, t)
        : ruled(phase, resolution) +
            gap * (1 - minimumJerk.share((t - lowered) / span)) +
            (carried > CARRY ? excess * carriedRate(carried, t - lowered) : 0);
    };

    // The reaching foot passes the take-off shank on its own side: along the
    // heading its gap to the take-off ankle is linear in the path's share, so
    // it passes at s* = g0 / (g0 − g1); a lateral gap there under two shank
    // radii (the passing clearance a line walk keeps) is opened by a bump that
    // is the shortfall at s* and zero at both ends, s(1 − s) / (s*(1 − s*)).
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: heading },
      { x: 0, y: 0, z: 1 },
    );
    const aside: IAutoMovieVector3 = Vector3.scale(
      Vector3.normalize(Vector3.cross({ x: 0, y: 1, z: 0 }, forward)),
      reaching === "left" ? 1 : -1,
    );
    const clearance: number = 2 * body.measure.shankRadius;
    const passing = (
      from: IAutoMovieVector3,
      into: IAutoMovieVector3,
      s: number,
    ): IAutoMovieVector3 => {
      const g0: number = Vector3.dot(
        Vector3.subtract(from, support.ankle),
        forward,
      );
      const g1: number = Vector3.dot(
        Vector3.subtract(into, support.ankle),
        forward,
      );
      // A pass is a sign change of two real gaps (`PASS_GAP`), strictly
      // inside the path.
      if (!(g0 * g1 < 0) || !(Math.min(Math.abs(g0), Math.abs(g1)) > PASS_GAP))
        return { x: 0, y: 0, z: 0 };
      const at: number = g0 / (g0 - g1);
      const gap: number = Vector3.dot(
        Vector3.subtract(Vector3.lerp(from, into, at), support.ankle),
        aside,
      );
      const bump: number = Math.max(0, clearance - gap);
      // Held at the full bump from the pass to its mirror share, so a pass
      // near either end does not swell the bump past it in between.
      return Vector3.scale(
        aside,
        bump * Math.min(1, (s * (1 - s)) / (at * (1 - at))),
      );
    };

    return {
      sample,
      swinging,
      arm: armAt,
      elbow: elbowAt,
      write: (
        phase: IPhase,
        joints: IAutoMovieMotionHumanPosture["joints"],
        limbs: IAutoMovieMotionHumanPosture["limbs"],
        resolution?: ReturnType<typeof prepareHumanPoseResolution>,
      ): void => {
        const t: number = phase.seconds;
        const root: IAutoMovieVector3 = phase.root;
        if (t >= P) {
          const end: Pick<IAutoMovieMotionHumanPosture, OfEnd> = jumpPushEnd(
            props,
            root,
            resolution,
          );
          Object.assign(joints, end.joints);
          Object.assign(limbs, end.limbs);
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
          reachingCarry > CARRY
            ? reachingCarry === P
              ? phase.carry
              : carriedRate(reachingCarry, t)
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
}

/**
 * The original entered shoulder angle, its authored target difference and
 * carried flexion rate, with the entered elbow's gap from the jump's elbow
 * rule.
 */
interface IArmTrack {
  /** Entered shoulder flexion, clinical degrees. */
  from: number;

  /**
   * Sixty degrees minus the entered flexion, preserving the original
   * subtraction.
   */
  delta: number;

  /** Entered flexion rate, degrees per second; zero when absent. */
  rate: number;

  /**
   * The entered elbow flexion less the jump's elbow rule at the entered
   * shoulder, clinical degrees; zero when the entry has no elbow.
   */
  bend: number;

  /**
   * That gap's entered rate, degrees per second: the elbow's rate less the
   * rule's share of the shoulder's; zero when the entry has no elbow.
   */
  bending: number;
}
