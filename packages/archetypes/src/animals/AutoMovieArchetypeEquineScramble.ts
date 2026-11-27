import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
} from "../core";
import { AutoMovieArchetypeEquineBank } from "./AutoMovieArchetypeEquineBank";
import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import type { QuadrupedRidePose } from "./quadruped/QuadrupedRidePose";
import type { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/**
 * A horse's scramble up a steep bank on a supported route: on a face too steep
 * for its loaded hooves to walk, it climbs in bounds, both fores reaching up
 * the face together while the hinds push, then both hinds landing under the
 * body while the fores push, over the top edge onto the run-out.
 *
 * Each bound covers `bound` metres of the leg's course distance. The fores
 * swing through the first half of a bound's time and stand through the second;
 * the hinds stand through the first half and swing through the second, so each
 * pair lands as the other leaves. Every foothold is the hoof's neutral point
 * under the course's placement at its landing, laid on the authored footing,
 * and is held fixed in the world while it stands; a swing travels between its
 * two footholds, raised by `REACH` (fores) or `PUSH` (hinds) of the limb's
 * length clear of the face. A face whose hooves would hold walks; one steeper
 * than `AutoMovieArchetypeEquineBank.STEEPEST` is a fall; a bound that climbs
 * more than `CLIMB` of the fore limb's length is beyond its reach.
 */
export namespace AutoMovieArchetypeEquineScramble {
  /**
   * A fore swing's clearance of the face, shares of the fore limb's length:
   * authored, provisional, a reaching bound.
   */
  export const REACH: number = 0.3;

  /**
   * A hind swing's clearance of the face, shares of the hind limb's length:
   * authored, provisional.
   */
  export const PUSH: number = 0.15;

  /**
   * The most a bound may climb, shares of the fore limb's length: authored,
   * provisional, the fore's reach.
   */
  export const CLIMB: number = 0.5;

  /**
   * A swinging limb's extra carpus or hock fold at mid-swing, degrees:
   * authored, provisional.
   */
  export const FOLD: number = 40;

  /** A scramble up the steep face a course leg climbs. */
  export interface IScramble {
    /** The discriminator. */
    kind: "bank-scramble";
    /**
     * The static friction coefficient between a loaded hoof and the face,
     * dimensionless, nonnegative.
     */
    friction: number;
    /** Where the friction comes from: a citation, or "authored". */
    source: string;
    /** Course metres one bound covers, positive. */
    bound: number;
    /** Seconds the gait blends into the first bound, positive. */
    entry: number;
    /**
     * Seconds the last bound blends back into the gait on the run-out,
     * positive.
     */
    exit: number;
  }

  /** An admitted scramble on the film clock. */
  export interface IWindow {
    /** The film second the face begins. */
    from: number;
    /** The film second the face ends. */
    to: number;
    /** Seconds blending in. */
    entry: number;
    /** Seconds blending out. */
    exit: number;
    /** The film seconds bounding each bound, `from` first and `to` last. */
    bounds: readonly number[];
    /** The course's body placement at a film second. */
    place: (seconds: number) => IAutoMovieTransform;
  }

  /**
   * Admit a scramble on one course leg.
   *
   * @param archetype The source archetype's identity.
   * @param index The leg's index.
   * @param leg The leg.
   * @param technique The scramble.
   * @param legs The course's leg count.
   * @param plan The course plan.
   * @param footing The course's authored footing.
   * @param reach The fore limb's length, metres.
   * @returns The window.
   * @throws {AutoMovieArchetypeRefusal} For a leg that is not a straight climb
   *   over footing with a run-out at its top, a face its hooves hold or one
   *   steeper than `AutoMovieArchetypeEquineBank.STEEPEST`, a bound climbing
   *   beyond `CLIMB` of the fore's reach, and nonfinite or overlapping blends.
   */
  export function admit(
    archetype: string,
    index: number,
    leg: AutoMovieArchetypeQuadruped.IRideLeg,
    technique: IScramble,
    legs: number,
    plan: AutoMovieArchetypeCourse.IPlan,
    footing: AutoMovieArchetypeQuadrupedFooting.IScene | undefined,
    reach: number,
  ): IWindow {
    const refuse = (reason: string): never => {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: `legs[${index}].equineFootwork`,
        value: null,
        feasible: null,
        reason,
        fix: "Scramble a straight climb over authored footing, steeper than the face's friction holds and no steeper than the technique's bound, in bounds the fores reach, with a run-out leg at its top.",
      });
    };
    if (leg.kind !== "straight" || leg.reverse || !((leg.rise ?? 0) > 0))
      return refuse("A bank scramble needs a straight forward climb");
    if (footing === undefined)
      return refuse("A bank scramble needs the face as authored footing");
    if (index === legs - 1)
      return refuse("A bank scramble needs a run-out leg over the top edge");
    const { friction, bound, entry, exit } = technique;
    if (!(friction >= 0) || technique.source.length === 0)
      return refuse(
        "A bank scramble states the face's friction and its source",
      );
    const grade: number = leg.rise! / leg.length;
    if (!(grade > friction))
      return refuse(
        `The face's grade ${grade} is held by its friction ${friction}: the hooves do not slip, so the horse walks up it`,
      );
    if (grade > AutoMovieArchetypeEquineBank.STEEPEST)
      return refuse(
        `The face's grade ${grade} is steeper than a scramble's ${AutoMovieArchetypeEquineBank.STEEPEST}`,
      );
    if (!(bound > 0 && bound <= leg.length))
      return refuse("A bound covers a positive share of the face");
    if (grade * bound > CLIMB * reach)
      return refuse(
        `A bound climbs ${grade * bound} m, beyond the fores' reach of ${CLIMB * reach} m`,
      );
    const span: AutoMovieArchetypeCourse.ILegSpan = plan.legSpans[index]!;
    const from: number = plan.when(span.from);
    const to: number = plan.when(span.from + span.span);
    if (!(entry > 0 && exit > 0 && entry + exit <= to - from))
      return refuse(
        "A bank scramble blends in and out over positive blends within the face",
      );
    const count: number = Math.max(1, Math.round(span.span / bound));
    const bounds: number[] = Array.from(
      { length: count + 1 },
      (_: unknown, k: number): number =>
        plan.when(span.from + (span.span * k) / count),
    );
    return {
      from,
      to,
      entry,
      exit,
      bounds,
      place: (seconds: number): IAutoMovieTransform =>
        plan.at(seconds).placement,
    };
  }

  /**
   * A hoof's goal while the horse scrambles: standing on its world foothold, or
   * swinging between two, raised clear of the face.
   *
   * @param windows The admitted scrambles.
   * @param seconds The film second.
   * @param fore Whether the hoof is a fore.
   * @param neutral The hoof's neutral point, model metres.
   * @param attachment The limb's attachment, model metres, whose height over
   *   the hoof is the limb's length.
   * @param goal The gait's goal for the hoof.
   * @param placement The body's world placement.
   * @param footing The course's prepared footing.
   * @returns The goal, the gait's outside a scramble.
   */
  export function goal(
    windows: readonly IWindow[],
    seconds: number,
    fore: boolean,
    neutral: IAutoMovieVector3,
    attachment: IAutoMovieVector3,
    goal: QuadrupedRidePose.IGoal,
    placement: IAutoMovieTransform,
    footing: AutoMovieArchetypeQuadrupedFooting.IPlan | undefined,
  ): QuadrupedRidePose.IGoal {
    const window: IWindow | undefined = windows.find(
      (w: IWindow): boolean => seconds > w.from && seconds < w.to,
    );
    if (window === undefined || footing === undefined) return goal;
    const amount: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.min(
        1,
        (seconds - window.from) / window.entry,
        (window.to - seconds) / window.exit,
      ),
    );
    const { bounds } = window;
    let k: number = 0;
    while (k + 2 < bounds.length && seconds >= bounds[k + 1]!) k++;
    const start: number = bounds[k]!;
    const end: number = bounds[k + 1]!;
    const middle: number = (start + end) / 2;
    const foothold = (
      at: number,
    ): AutoMovieArchetypeQuadrupedFooting.ILanding => {
      const placed: IAutoMovieTransform = window.place(at);
      return footing.landing(
        AutoMovieEngineVector3.add(
          placed.translation,
          AutoMovieEngineQuaternion.rotateVector(placed.rotation, neutral),
        ),
        placed.rotation,
      );
    };
    // A fore stands from a bound's middle to its end and swings from its start to its middle; a hind the other way round.
    const swinging: boolean = fore ? seconds < middle : seconds >= middle;
    const left: number = fore ? start - (end - start) / 2 : start;
    const lands: number = fore ? middle : end;
    const stood: number = fore ? (seconds < middle ? left : middle) : start;
    const share: number = swinging
      ? (seconds - (fore ? start : middle)) / (end - start) / 0.5
      : 0;
    const from: AutoMovieArchetypeQuadrupedFooting.ILanding = foothold(
      swinging ? Math.max(window.from, left) : stood,
    );
    const to: AutoMovieArchetypeQuadrupedFooting.ILanding = swinging
      ? foothold(lands)
      : from;
    const world: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(from.point, to.point, share);
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      placement.rotation,
    );
    const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      inverse,
      AutoMovieEngineVector3.subtract(world, placement.translation),
    );
    const normal: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.lerp(from.normal, to.normal, share),
    );
    const arc: number = Math.sin(Math.PI * Math.min(1, Math.max(0, share)));
    const length: number = attachment.y - neutral.y;
    const lift: number = swinging ? (fore ? REACH : PUSH) * length * arc : 0;
    const fold: number = swinging ? FOLD * arc : 0;
    const x: number = goal.x ?? neutral.x;
    return {
      ...goal,
      x: x + (local.x - x) * amount,
      z: goal.z + (local.z - goal.z) * amount,
      orientation: AutoMovieEngineQuaternion.slerp(
        goal.orientation ?? AutoMovieEngineQuaternion.identity(),
        AutoMovieEngineQuaternion.multiply(
          inverse,
          AutoMovieEngineQuaternion.slerp(from.rotation, to.rotation, share),
        ),
        amount,
      ),
      surface: {
        point: local,
        normal: AutoMovieEngineQuaternion.rotateVector(inverse, normal),
      },
      lift: goal.lift + (lift - goal.lift) * amount,
      fold: goal.fold + (fold - goal.fold) * amount,
    };
  }
}
