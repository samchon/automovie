import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTurnHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { HumanArmTrajectoryTerms } from "../../posture/internal/HumanArmTrajectoryTerms";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanAdaptiveKnots } from "../../posture/internal/prepareHumanAdaptiveKnots";
import { resolveHumanPostureSource } from "../../posture/internal/resolveHumanPostureSource";
import { turnHumanPosture } from "../../posture/internal/turnHumanPosture";

/*
 * The knots a carry's lift or set-down keeps of the carried body's frozen
 * posture (`HumanCarriedLift`): the whole-posture fit of the carry at a second,
 * written by its solved joint angles (`GymnasticsFlight.frozen`), kept at knots
 * AutoKnots places (Vitenti et al. 2024, arXiv:2412.13423;
 * `prepareHumanAdaptiveKnots`) on the quantity the criterion is read on: every
 * joint centre of the fit, so each sub-interval is accepted to the solver's own
 * millimetre (`HumanArmTrajectoryTerms.TOLERANCE`) and no phase is knotted
 * finer than the frame grid (`AutoMovieMotionHumanArmCourse.STEP`).
 *
 * Between knots the reading is interpolated per field, the joint angles and the
 * heading angles linearly (the heading the shorter way round), the turned
 * root's position linearly and its rotation by slerp, so a knot reads exactly
 * its own fit. The lift's blend mixes the knot posture into the entry or the
 * stand with a share of at most one (`HumanCarriedLift`). The knots are fitted
 * when the plan is prepared (`prepare`); a read before that fits its own second
 * and keeps nothing.
 */ export namespace HumanCarriedLiftKnots {
  /*
   * The farthest an interpolated posture may put a joint centre from the
   * middle's own fit, metres: the solver's millimetre.
   */
  export const TOLERANCE: number = HumanArmTrajectoryTerms.TOLERANCE / 1000;

  /*
   * The shortest interval split, seconds: the frame grid the courses are read
   * on.
   */
  export const STEP: number = AutoMovieMotionHumanArmCourse.STEP;

  /*
   * One kept fit.
   */
  export interface IKnot {
    /*
     * The plan second.
     */
    seconds: number;

    /*
     * The reading there, the fit's own.
     */
    reading: IReading;
  }

  /*
   * The frozen posture at a second, with what the set-down's stand reads of it.
   */
  export interface IReading {
    /*
     * The frozen posture: joint angles, heading and root, no limb goals.
     */
    posture: IAutoMovieMotionHumanPosture;

    /*
     * Its authored root, world metres (the posture's `root`, before any
     * whole-body rotation).
     */
    root: IAutoMovieVector3;

    /*
     * Its turned root's world rotation (`turnHumanPosture`).
     */
    rotation: IAutoMovieQuaternion;
  }

  /*
   * A phase's knots.
   */
  export interface ICourse {
    /*
     * The phase's first plan second.
     */
    from: number;

    /*
     * Its last.
     */
    to: number;

    /*
     * Its knots, ascending, once the plan is prepared.
     */
    knots?: readonly IKnot[];
  }
  /*
   * The carry's frozen posture at a plan second.
   */
  export type Frozen = (seconds: number) => IAutoMovieMotionHumanPosture;

  /*
   * An empty course over a phase.
   * Parameter from: The phase's first plan second.
   * Parameter to: Its last.
   * Returns: The course, fitted when prepared.
   */
  export function course(from: number, to: number): ICourse {
    return { from, to };
  }

  /*
   * Fit a phase's knots where AutoKnots places them on the fit's joint centres.
   * Parameter course: The phase's course, its knots set here.
   * Parameter body: The carried body.
   * Parameter frozen: The carry's frozen posture at a plan second, fitted for a
   * knot.
   */
  export function prepare(
    course: ICourse,
    body: IAutoMovieMotionHumanBody,
    frozen: Frozen,
  ): void {
    if (!(course.to > course.from)) {
      course.knots = [
        { seconds: course.from, reading: own(frozen(course.from)) },
      ];
      return;
    }
    const knots: prepareHumanAdaptiveKnots.ISeededKnots<IReading> =
      prepareHumanAdaptiveKnots.seeded<IReading>({
        from: course.from,
        to: course.to,
        evaluate: (
          seconds: number,
        ): prepareHumanAdaptiveKnots.IPoint<IReading> => {
          const reading: IReading = own(frozen(seconds));
          return { values: centres(body, reading.posture), payload: reading };
        },
        tolerance: { kind: "absolute", absolute: TOLERANCE },
        maxKnots: Math.ceil((course.to - course.from) / STEP) + 1,
      });
    course.knots = knots.times.map(
      (seconds: number, k: number): IKnot => ({
        seconds,
        reading: knots.payloads[k]!,
      }),
    );
  }

  /*
   * The frozen posture at a plan second of the phase: a knot's own fit where
   * the course keeps a knot there, else interpolated between the two knots
   * around it; the second's own fit before the course is prepared.
   * Parameter course: The phase's course.
   * Parameter seconds: The plan second, clamped into the phase.
   * Parameter frozen: The carry's frozen posture at a plan second.
   * Returns: The reading.
   */
  export function read(
    course: ICourse,
    seconds: number,
    frozen: Frozen,
  ): IReading {
    const at: number = Math.min(Math.max(seconds, course.from), course.to);
    const knots: readonly IKnot[] | undefined = course.knots;
    if (knots === undefined) return own(frozen(at));
    let low: number = 0;
    let high: number = knots.length - 1;
    while (high - low > 1) {
      const middle: number = (low + high) >> 1;
      if (knots[middle]!.seconds <= at) low = middle;
      else high = middle;
    }
    const a: IKnot = knots[low]!;
    const b: IKnot = knots[high]!;
    if (at === a.seconds || b.seconds === a.seconds) return a.reading;
    if (at === b.seconds) return b.reading;
    return between(
      a.reading,
      b.reading,
      (at - a.seconds) / (b.seconds - a.seconds),
    );
  }
  /*
   * A frozen posture's own reading.
   */
  function own(posture: IAutoMovieMotionHumanPosture): IReading {
    return {
      posture,
      root: posture.root,
      rotation: turnHumanPosture(posture).rotation,
    };
  }

  /*
   * Every joint centre of a joint-only posture, by its assembly's forward
   * kinematics, as one coordinate vector in the rig's bone order.
   */
  function centres(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): number[] {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPostureSource.assemble(body, posture).pose,
    );
    return [...bones.values()].flatMap(
      (bone: IAutoMovieResolvedBone): number[] => [
        bone.worldPosition.x,
        bone.worldPosition.y,
        bone.worldPosition.z,
      ],
    );
  }
  /*
   * Two readings interpolated at a share: angles and positions linearly, the
   * heading the short way round, the turned rotation by slerp.
   */
  function between(from: IReading, to: IReading, share: number): IReading {
    const a: IAutoMovieMotionHumanPosture = from.posture;
    const b: IAutoMovieMotionHumanPosture = to.posture;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const bone of new Set([
      ...Object.keys(a.joints),
      ...Object.keys(b.joints),
    ]) as Set<AutoMovieHumanoidBone>) {
      const p: readonly [number, number, number] = a.joints[bone] ?? [0, 0, 0];
      const q: readonly [number, number, number] = b.joints[bone] ?? [0, 0, 0];
      joints[bone] = [
        p[0] + (q[0] - p[0]) * share,
        p[1] + (q[1] - p[1]) * share,
        p[2] + (q[2] - p[2]) * share,
      ];
    }
    const turn: number = ((((b.yaw - a.yaw) % 360) + 540) % 360) - 180;
    const ta: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
      turnHumanPosture(a);
    const tb: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
      turnHumanPosture(b);
    const position: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
      ta.position,
      tb.position,
      share,
    );
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.slerp(
      from.rotation,
      to.rotation,
      share,
    );
    const heading: IHeading = {
      yaw: a.yaw + turn * share,
      pitch: a.pitch + (b.pitch - a.pitch) * share,
      roll: a.roll + (b.roll - a.roll) * share,
    };

    // The turned root is written as a rotation about the root itself, so
    // the posture turns to exactly the interpolated position and rotation.
    return {
      posture: {
        root: position,
        ...heading,
        joints,
        limbs: {},
        rotation: {
          about: position,
          turn: AutoMovieEngineQuaternion.multiply(
            rotation,
            AutoMovieEngineQuaternion.inverse(humanPostureHeading(heading)),
          ),
        },
      },
      root: AutoMovieEngineVector3.lerp(from.root, to.root, share),
      rotation,
    };
  }
}

/*
 * The alternatives of `Heading`'s site.
 */
type Heading = "yaw" | "pitch" | "roll";

/*
 * A posture's heading angles, degrees.
 */
type IHeading = Pick<IAutoMovieMotionHumanPosture, Heading>;
