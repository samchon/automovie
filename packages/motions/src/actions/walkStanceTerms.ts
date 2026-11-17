

import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSequentialConvex,
} from "@automovie/interface";

import { HumanQuadraticProgram as Q } from "../posture/HumanQuadraticProgram";
import { walkStanceCourse } from "./walkStanceCourse";

/**
 * The layout of a stance course's variables and the constants its solve
 * reads (`walkStanceCourse`): each knot's variables and a leg's own among
 * them, the steps and accelerations its differences read, the trust region,
 * the units, the scale and the schedule of the sequential convex loop, the
 * penalties and the landing's weight.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the record holds and who reads it.
 * @evidence contracts/development/design.md#principled-representation One owner for the variables' layout and every constant of the solve, so the geometry, the model and the solve read the same.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The layout, the constants and two small functions on them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each value states its source or its provisional status where it is declared.
 */
export namespace walkStanceTerms {
  /** A leg's own variables at a knot, in the order a swivel's piece reads them: the drop, the trunk's pitch and roll, and the foot's pitch, turn and slide across and along. */
  export const LEG: readonly string[] = [
    "drop",
    "trunk pitch",
    "trunk roll",
    "pitch",
    "turn",
    "slide x",
    "slide z",
  ];

  /**
   * A leg's own variables' indices in a course's variable vector (`LEG`).
   *
   * @param knot The knot's index.
   * @param side The leg.
   * @returns The indices.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines LEG order and conversion from one knot/side to flat course indices.
   * @evidence contracts/development/implementation.md#principled-implementation Adds the knot's WIDTH offset to the same seven shared drop/trunk and side-specific foot slots used by legOf.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One immutable side table owns slot selection for both consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing coordinate order and ordinary index arithmetic without a body-specific mapping.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant seven-slot work and one caller-owned result array; slot arrays are prepared once for the two supported sides.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses immutable LEG_SLOTS while every returned index list is fresh and safe for caller mutation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no query state; the module owns only fourteen fixed slot values.
   */
  export function variables(knot: number, side: "left" | "right"): number[] {
    return LEG_SLOTS[side].map((slot: number): number =>
      WIDTH * knot + slot,
    );
  }

  /** The variables of a knot: the drop, the left and the right pitch, the trunk's pitch and roll, the left and the right turn, and the left and the right slide along x and z. */
  export const WIDTH: number = 11;

  /** The half-bandwidth of the course's quadratic programs: a second difference spans two knots. */
  export const BAND: number = 2 * WIDTH;

  /** Each variable's forward-difference step: a hundredth of a millimetre of drop or of slide, a thousandth of a degree, a heel's toward rising. */
  export const STEPS: readonly number[] = [
    1e-5, -1e-3, -1e-3, 1e-3, 1e-3, 1e-3, 1e-3, 1e-5, 1e-5, 1e-5, 1e-5,
  ];

  /** Each variable's acceleration against `ACCELERATION`. */
  export const ACCELERATIONS: readonly number[] = [
    walkStanceCourse.ACCELERATION.drop,
    walkStanceCourse.ACCELERATION.pitch,
    walkStanceCourse.ACCELERATION.pitch,
    walkStanceCourse.ACCELERATION.trunk,
    walkStanceCourse.ACCELERATION.trunk,
    walkStanceCourse.ACCELERATION.turn,
    walkStanceCourse.ACCELERATION.turn,
    walkStanceCourse.ACCELERATION.drop,
    walkStanceCourse.ACCELERATION.drop,
    walkStanceCourse.ACCELERATION.drop,
    walkStanceCourse.ACCELERATION.drop,
  ];

  /** The trust region at its widest: a step of the drop, metres, and of an angle, degrees. */
  export const TRUST: { drop: number; angle: number; slide: number } = {
    drop: 0.02,
    angle: 5,
    slide: 0.02,
  };

  /** Each variable's unit in the trust region (`TRUST`), by its slot in a knot (`WIDTH`). */
  export const UNIT: readonly number[] = [
    TRUST.drop,
    TRUST.angle,
    TRUST.angle,
    TRUST.angle,
    TRUST.angle,
    TRUST.angle,
    TRUST.angle,
    TRUST.slide,
    TRUST.slide,
    TRUST.slide,
    TRUST.slide,
  ];

  /** Each of a leg's own variables' scale (`LEG`), the trust region's width for it (`TRUST`): metres of drop, degrees of the trunk's tilt and of the foot's pitch and turn, metres of slide. */
  export const SCALE: readonly number[] = [
    TRUST.drop,
    TRUST.angle,
    TRUST.angle,
    TRUST.angle,
    TRUST.angle,
    TRUST.slide,
    TRUST.slide,
  ];

  /**
   * A body's course's trust-region schedule for the shared loop
   * (`HumanSequentialConvex.ISchedule`): Nocedal and Wright's Algorithm 4.1
   * (Numerical Optimization, 2nd ed., 2006) as written. A step is taken
   * where the merit falls at all, `eta` at the low end of the algorithm's
   * [0, 1/4); a step whose ratio is under 1/4 quarters the region, and one
   * over 3/4 that reaches the region's edge doubles it, to the widest. The
   * region's unit is `TRUST`, the widest step the course's linearisation is
   * trusted over, so the widest region and the first are one. The solve has
   * settled where the region could move no variable by the constraints'
   * tolerance (`MET` degrees of an angle, or a drop or a slide of the length
   * the leg turns through that many degrees to move its ankle by,
   * `reachOf`), which the region reaches from the widest in `tries`
   * quarterings, or where the model predicts a decrease under the quadratic
   * program's relative accuracy of the merit
   * (`HumanQuadraticProgram.TOLERANCE`), which its step cannot resolve.
   *
   * @param body The body.
   * @returns The schedule.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents trust units, cited ratio/expansion policy, degree/metre least width and quadratic merit precision.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the cited trust-region schedule and converts MET angle to a leg-length displacement for the smallest meaningful drop/slide step.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One physical-resolution calculation feeds the fixed schedule fields and merit-precision reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains every original shrink, growth, ratio, least-width and attempt formula with no numerical relaxation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work independent of course knot count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the shared stance constants and reach formula; the returned schedule owns no computed pose or solver state.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fixed-size record and retains no body or handle.
   */
  export function schedule(body: IAutoMovieMotionHumanBody): IAutoMovieMotionHumanSequentialConvex.ISchedule {
    const length: number = (walkStanceCourse.MET * Math.PI * reachOf(body)) / 180;
    const least: number = Math.min(
      length / TRUST.drop,
      length / TRUST.slide,
      walkStanceCourse.MET / TRUST.angle,
    );
    const shrink: number = 1 / 4;
    return {
      eta: 0,
      low: 1 / 4,
      high: 3 / 4,
      shrink,
      expand: 2,
      boundary: true,
      widest: 1,
      trust: 1,
      least,
      tries: Math.ceil(Math.log(least) / Math.log(shrink)),
      improved: (merit: number): number => Q.TOLERANCE * merit,
    };
  }

  /**
   * A leg's reach at its least knee flexion, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names knee flexion, hip-to-ankle metres and the measured thigh/shank inputs.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the law of cosines at the unchanged KNEE angle over this body's thigh and shank lengths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One explicit cosine expression owns the stance reach limit and schedule's length conversion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the original measured body lengths and minimum knee flexion without a fitted reach or tolerance adjustment.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar arithmetic and one cosine.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Geometry and trust scheduling call this same physical formula; no mutable body result is cached here.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no inputs.
   */
  export function reachOf(body: IAutoMovieMotionHumanBody): number {
    return Math.sqrt(
      body.measure.thigh ** 2 +
        body.measure.shank ** 2 +
        2 *
          body.measure.thigh *
          body.measure.shank *
          Math.cos((walkStanceCourse.KNEE * Math.PI) / 180),
    );
  }
  /** The penalty the course's constraints are first weighed by, which the steering raises where the course needs it (`HumanSequentialConvex.IOptions.steer`): KNITRO-Active's first penalty (Byrd, Nocedal and Waltz 2008, Optim Methods Softw 23:197; p. 13 of the 2007 technical report), as TrajOpt's (Schulman et al. 2014; sco's initial_merit_error_coeff). */
  export const PENALTY: number = 10;

  /** Convexifications per penalty at most: TrajOpt's default (sco's max_iter, 50). */
  export const ROUNDS: number = 50;

  /** Metres a landing lies off its goal that cost as much as a spread of dorsiflexion past heel-off (provisional): a landing goes where it is aimed unless the legs cannot hold it there. */
  export const PLACE: number = 0.01;

  /**
   * A leg's vth LEG variable at a knot whose flat variables begin at o.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the knot offset and shared LEG coordinate order; v is supplied in [0,7).
   * @evidence contracts/development/implementation.md#principled-implementation Selects the same fixed shared/side slot as variables and adds the caller's knot offset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A shared two-side slot table removes per-coordinate construction of the existing seven-slot layout.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains ordinary JavaScript indexing behavior and every original slot value without a narrowed body model.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant indexed arithmetic with no per-call array allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses fourteen immutable module-owned slot numbers for both index operations.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no query state or handle.
   */
  export function legOf(o: number, side: "left" | "right", v: number): number {
    return o + LEG_SLOTS[side][v]!;
  }

  /**
   * The smooth hinge ln(1+exp(v)) in the stance residual's dimensionless units.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the soft hinge expression and dimensionless input/output.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates log1p(exp(v)), retaining the original large-positive v asymptote to avoid exponential overflow.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One original cutoff branch selects direct log1p or the asymptote.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing v>30 cutoff and returned formula with no tuned coefficient.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work and no allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every stance heel-off residual uses this same function; distinct residual values are computed directly.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input or output.
   */
  export function softplus(v: number): number {
    return v > 30 ? v : Math.log1p(Math.exp(v));
  }

  /** Shared drop/trunk slots and the two feet's original pitch/turn/slide slots. */
  const LEG_SLOTS: Readonly<Record<"left" | "right", readonly number[]>> = {
    left: [0, 3, 4, 1, 5, 7, 8],
    right: [0, 3, 4, 2, 6, 9, 10],
  };
}
