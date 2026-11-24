import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTurnHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../compose/AutoMovieMotionHumanArmCourse";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPostureSource } from "../posture/resolveHumanPostureSource";
import { turnHumanPosture } from "../posture/turnHumanPosture";

/**
 * The knots a carry's lift or set-down keeps of the carried body's frozen
 * posture (`HumanCarriedLift`): the whole-posture fit of the carry at a second,
 * written by its solved joint angles (`GymnasticsFlight.frozen`), kept at the
 * phase's two ends and wherever interpolating between two knots leaves the knot
 * fitted at their middle, and interpolated between them.
 *
 * Interpolation is per field, the joint angles and the heading angles linearly
 * (the heading the shorter way round), the turned root's position linearly and
 * its rotation by slerp, so a knot reads exactly its own fit. An interval is
 * split at its middle when the interpolated posture puts any joint centre
 * farther than the solver's own millimetre
 * (`HumanArmTrajectoryTerms.TOLERANCE`) from the middle's fit, down to the
 * frame grid (`AutoMovieMotionHumanArmCourse.STEP`), as an adaptive
 * tessellation keeps a curve within its tolerance. The lift's blend mixes the
 * knot posture into the entry or the stand with a share of at most one
 * (`HumanCarriedLift`), so to first order the blended pose departs from the
 * per-second blend by no more than the knot posture departs from the second's
 * own fit: the millimetre the split admits at the judged middles. The knots are
 * fitted when the plan is prepared (`prepare`); a read before that judges the
 * intervals on its way afresh and keeps none.
 */
export namespace HumanCarriedLiftKnots {
  /**
   * The farthest an interpolated posture may put a joint centre from the
   * middle's own fit, metres: the solver's millimetre.
   */
  export const TOLERANCE: number = HumanArmTrajectoryTerms.TOLERANCE / 1000;

  /**
   * The shortest interval split, seconds: the frame grid the courses are read
   * on.
   */
  export const STEP: number = AutoMovieMotionHumanArmCourse.STEP;

  /** One kept fit. */
  export interface IKnot {
    /** The plan second. */
    seconds: number;

    /** The reading there, the fit's own. */
    reading: IReading;
  }

  /** The frozen posture at a second, with what the set-down's stand reads of it. */
  export interface IReading {
    /** The frozen posture: joint angles, heading and root, no limb goals. */
    posture: IAutoMovieMotionHumanPosture;

    /**
     * Its authored root, world metres (the posture's `root`, before any
     * whole-body rotation).
     */
    root: IAutoMovieVector3;

    /** Its turned root's world rotation (`turnHumanPosture`). */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * An interval between two knots, split where interpolation leaves the
   * middle's fit.
   */
  export interface IInterval {
    /** The knot at its start. */
    a: IKnot;

    /** The knot at its end. */
    b: IKnot;

    /** Its halves, null for a leaf; absent on an interval a cold read judges. */
    halves?: Halves;
  }

  /** A phase's knots. */
  export interface ICourse {
    /** The phase's first plan second. */
    from: number;

    /** Its last. */
    to: number;

    /** Its whole interval, every split judged, once the plan is prepared. */
    whole?: IInterval;
  }

  /** The carry's frozen posture at a plan second. */
  export type Frozen = (seconds: number) => IAutoMovieMotionHumanPosture;

  /**
   * An empty course over a phase.
   *
   * @param from The phase's first plan second.
   * @param to Its last.
   * @returns The course, fitted when prepared.
   */
  export function course(from: number, to: number): ICourse {
    return { from, to };
  }

  /**
   * Fit a phase's knots: its two ends and every middle its judgement splits
   * at, down to the frame grid.
   *
   * @param course The phase's course, its whole interval set here.
   * @param body The carried body.
   * @param frozen The carry's frozen posture at a plan second, fitted for a
   *   knot.
   */
  export function prepare(
    course: ICourse,
    body: IAutoMovieMotionHumanBody,
    frozen: Frozen,
  ): void {
    const knot = (t: number): IKnot => ({
      seconds: t,
      reading: own(frozen(t)),
    });
    const refine = (piece: IInterval): IInterval => {
      const halves: Halves = judged(body, piece, knot);
      return {
        ...piece,
        halves: halves === null ? null : [refine(halves[0]), refine(halves[1])],
      };
    };
    course.whole = refine({ a: knot(course.from), b: knot(course.to) });
  }

  /**
   * The frozen posture at a plan second of the phase: a knot's own fit where
   * the course keeps a knot there, else interpolated between the two knots
   * around it. Before the course is prepared, the intervals on the way are
   * judged afresh and kept by no one.
   *
   * @param course The phase's course.
   * @param body The carried body.
   * @param seconds The plan second, clamped into the phase.
   * @param frozen The carry's frozen posture at a plan second, fitted for a
   *   knot.
   * @returns The reading.
   */
  export function read(
    course: ICourse,
    body: IAutoMovieMotionHumanBody,
    seconds: number,
    frozen: Frozen,
  ): IReading {
    const at: number = Math.min(Math.max(seconds, course.from), course.to);
    const knot = (t: number): IKnot => ({
      seconds: t,
      reading: own(frozen(t)),
    });
    let piece: IInterval = course.whole ?? {
      a: knot(course.from),
      b: knot(course.to),
    };
    for (;;) {
      if (at === piece.a.seconds) return piece.a.reading;
      if (at === piece.b.seconds) return piece.b.reading;
      const halves: Halves =
        piece.halves !== undefined ? piece.halves : judged(body, piece, knot);
      if (halves === null) break;
      piece = at < halves[0].b.seconds ? halves[0] : halves[1];
    }
    const { a, b }: IInterval = piece;
    return between(
      a.reading,
      b.reading,
      (at - a.seconds) / (b.seconds - a.seconds),
    );
  }
  /** A frozen posture's own reading. */
  function own(posture: IAutoMovieMotionHumanPosture): IReading {
    return {
      posture,
      root: posture.root,
      rotation: turnHumanPosture(posture).rotation,
    };
  }

  /**
   * An interval's halves, or null for a leaf: split where the interpolated
   * middle leaves the middle's own fit.
   */
  function judged(
    body: IAutoMovieMotionHumanBody,
    piece: IInterval,
    knot: (t: number) => IKnot,
  ): Halves {
    const { a, b }: IInterval = piece;
    if (b.seconds - a.seconds <= STEP) return null;
    const middle: IKnot = knot((a.seconds + b.seconds) / 2);
    const exact: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = placed(
      body,
      middle.reading.posture,
    );
    const guessed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = placed(
      body,
      between(a.reading, b.reading, 0.5).posture,
    );
    for (const [bone, there] of exact) {
      const other: IAutoMovieResolvedBone | undefined = guessed.get(bone);
      if (
        other === undefined ||
        Vector3.distance(there.worldPosition, other.worldPosition) > TOLERANCE
      )
        return [
          { a, b: middle },
          { a: middle, b },
        ];
    }
    return null;
  }

  /**
   * Every joint centre of a joint-only posture: its assembly's forward
   * kinematics.
   */
  function placed(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return poseBones(
      body,
      resolveHumanPostureSource.assemble(body, posture).pose,
    );
  }

  /**
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
    const position: IAutoMovieVector3 = Vector3.lerp(
      ta.position,
      tb.position,
      share,
    );
    const rotation: IAutoMovieQuaternion = Quaternion.slerp(
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
          turn: Quaternion.multiply(
            rotation,
            Quaternion.inverse(humanPostureHeading(heading)),
          ),
        },
      },
      root: Vector3.lerp(from.root, to.root, share),
      rotation,
    };
  }
}

/** An interval's halves: the two, or null for a leaf. */
type Halves =
  | readonly [HumanCarriedLiftKnots.IInterval, HumanCarriedLiftKnots.IInterval]
  | null;
/** The alternatives of `Heading`'s site. */
type Heading = "yaw" | "pitch" | "roll";

/** A posture's heading angles, degrees. */
type IHeading = Pick<IAutoMovieMotionHumanPosture, Heading>;
