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
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { turnHumanPosture } from "../posture/turnHumanPosture";

/**
 * The knots a carry's lift or set-down keeps of the carried body's frozen
 * posture (`HumanCarriedLift`): the whole-posture fit of the carry at a
 * second, written by its solved joint angles (`GymnasticsFlight.frozen`),
 * kept at the phase's two ends and wherever interpolating between two knots
 * leaves the knot fitted at their middle, and interpolated between them.
 *
 * Interpolation is per field, the joint angles and the heading angles
 * linearly (the heading the shorter way round), the turned root's position
 * linearly and its rotation by slerp, so a knot reads exactly its own fit.
 * An interval is split at its middle when the interpolated posture puts any
 * joint centre farther than the solver's own millimetre
 * (`HumanArmTrajectoryTerms.TOLERANCE`) from the middle's fit, down to the
 * frame grid (`AutoMovieMotionHumanArmCourse.STEP`), as an adaptive
 * tessellation keeps a curve within its tolerance. The lift's blend mixes
 * the knot posture into the entry or the stand with a share of at most one
 * (`HumanCarriedLift`), so to first order the blended pose departs from the
 * per-second blend by no more than the knot posture departs from the
 * second's own fit: the millimetre the split admits at the judged middles.
 * The knots are fitted on first demand and kept by the course.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept, how it is interpolated, the split rule with its tolerance and grid, the blend's error bound and when knots are made.
 * @evidence contracts/development/design.md#principled-representation A phase's span with its knots in a binary refinement; a reading is the frozen posture and the root and rotation the set-down's stand reads.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `course`, `read` and their three records, read only by `HumanCarriedLift`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fit stays the caller's (`GymnasticsFlight.frozen` of the carry's own posture); the tolerance and grid are the solver's and the frame grid's.
 */
export namespace HumanCarriedLiftKnots {
  /** The farthest an interpolated posture may put a joint centre from the middle's own fit, metres: the solver's millimetre. */
  export const TOLERANCE: number = HumanArmTrajectoryTerms.TOLERANCE / 1000;

  /** The shortest interval split, seconds: the frame grid the courses are read on. */
  export const STEP: number = AutoMovieMotionHumanArmCourse.STEP;

  /**
   * One kept fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The second, the frozen posture and its turned root.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Written and read only by this namespace.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The fit's own records.
   */
  export interface IKnot {
    /** The plan second. */
    seconds: number;

    /** The reading there, the fit's own. */
    reading: IReading;
  }

  /**
   * The frozen posture at a second, with what the set-down's stand reads of it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member and its frame.
   * @evidence contracts/development/design.md#principled-representation A posture and two world quantities of its root.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanCarriedLift` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture and vector records.
   */
  export interface IReading {
    /** The frozen posture: joint angles, heading and root, no limb goals. */
    posture: IAutoMovieMotionHumanPosture;

    /** Its authored root, world metres (the posture's `root`, before any whole-body rotation). */
    root: IAutoMovieVector3;

    /** Its turned root's world rotation (`turnHumanPosture`). */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * An interval between two knots, split where interpolation leaves the middle's fit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the members.
   * @evidence contracts/development/design.md#principled-representation A binary refinement over knot pairs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Written and read only by this namespace.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The split is decided once from the interval's own ends.
   */
  export interface IInterval {
    /** The knot at its start. */
    a: IKnot;

    /** The knot at its end. */
    b: IKnot;

    /** Its halves, where it was split; undefined until judged, null for a leaf. */
    halves?: Halves;
  }

  /**
   * A phase's knots.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the members.
   * @evidence contracts/development/design.md#principled-representation The phase's span and its refinement, made on first read.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Made by `course`, read by `read`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No fit is made before a second of the phase is read.
   */
  export interface ICourse {
    /** The phase's first plan second. */
    from: number;

    /** Its last. */
    to: number;

    /** Its whole interval, once its two ends are fitted. */
    whole?: IInterval;
  }

  /**
   * The carry's frozen posture at a plan second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it returns and at which second.
   * @evidence contracts/development/design.md#principled-representation A plan second in, the posture written by its solved angles out.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The one callback `read` fits knots with.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The fit is the caller's.
   */
  export type Frozen = (seconds: number) => IAutoMovieMotionHumanPosture;

  /**
   * An empty course over a phase.
   *
   * @param from The phase's first plan second.
   * @param to Its last.
   * @returns The course, fitted on first read.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the span and that nothing is fitted yet.
   * @evidence contracts/development/implementation.md#principled-implementation A phase's knots depend on its span and the carry's posture alone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No input is judged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share yet.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The record holds its knots once read, for its plan's life.
   */
  export function course(from: number, to: number): ICourse {
    return { from, to };
  }

  /**
   * The frozen posture at a plan second of the phase: a knot's own fit where
   * the course keeps a knot there, else interpolated between the two knots
   * around it, the course refined on the way where its judgement needs.
   *
   * @param course The phase's course.
   * @param body The carried body.
   * @param seconds The plan second, clamped into the phase.
   * @param frozen The carry's frozen posture at a plan second, fitted for a knot.
   * @returns The reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read where.
   * @evidence contracts/development/implementation.md#principled-implementation A binary refinement judged at middles against the solver's millimetre on every joint centre, down to the frame grid, read by descent and per-field interpolation; a knot reads its own fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fit the ends, descend judging each interval once, interpolate at the leaf.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every knot is the caller's full fit; an interval is kept whole only where its middle's fit is within the tolerance of the interpolation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fit and two joint-only assemblies with their forward kinematics a judged interval, at most the phase over the frame grid's halvings deep; a read past the judged intervals costs a descent and one interpolation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Knots and judgements are kept by the course and shared by every read of the phase.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The course keeps its knots, at most two a frame-grid interval of the phase.
   */
  export function read(
    course: ICourse,
    body: IAutoMovieMotionHumanBody,
    seconds: number,
    frozen: Frozen,
  ): IReading {
    const at: number = Math.min(Math.max(seconds, course.from), course.to);
    const knot: (t: number) => HumanCarriedLiftKnots.IKnot = (t: number): IKnot => ({
      seconds: t,
      reading: own(frozen(t)),
    });
    course.whole ??= { a: knot(course.from), b: knot(course.to) };
    let piece: IInterval = course.whole;
    for (;;) {
      if (at === piece.a.seconds) return piece.a.reading;
      if (at === piece.b.seconds) return piece.b.reading;
      if (piece.halves === undefined) piece.halves = judged(body, piece, knot);
      if (piece.halves === null) break;
      piece = at < piece.halves[0].b.seconds ? piece.halves[0] : piece.halves[1];
    }
    const { a, b }: IInterval = piece;
    return between(a.reading, b.reading, (at - a.seconds) / (b.seconds - a.seconds));
  }

  /** A frozen posture's own reading. */
  function own(posture: IAutoMovieMotionHumanPosture): IReading {
    return {
      posture,
      root: posture.root,
      rotation: turnHumanPosture(posture).rotation,
    };
  }

  /** An interval's halves, or null for a leaf: split where the interpolated middle leaves the middle's own fit. */
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

  /** Every joint centre of a joint-only posture: its assembly's forward kinematics. */
  function placed(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return poseBones(body, resolveHumanPosture.assemble(body, posture).pose);
  }

  /** Two readings interpolated at a share: angles and positions linearly, the heading the short way round, the turned rotation by slerp. */
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
    const ta: IAutoMovieMotionHumanTurnHumanPosture.ITurned = turnHumanPosture(a);
    const tb: IAutoMovieMotionHumanTurnHumanPosture.ITurned = turnHumanPosture(b);
    const position: IAutoMovieVector3 = Vector3.lerp(ta.position, tb.position, share);
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
            Quaternion.inverse(resolveHumanPosture.heading(heading)),
          ),
        },
      },
      root: Vector3.lerp(from.root, to.root, share),
      rotation,
    };
  }
}

/** An interval's halves: the two, or null for a leaf. */
type Halves = readonly [HumanCarriedLiftKnots.IInterval, HumanCarriedLiftKnots.IInterval] | null;

/** A posture's heading angles, degrees. */
type IHeading = Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll">;
