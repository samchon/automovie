import { AutoMovieEngineGravity, AutoMovieEngineQuaternion } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import { ArchetypeCourseLegs } from "./internal/ArchetypeCourseLegs";
import { ArchetypeCourseTimed } from "./internal/ArchetypeCourseTimed";
import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";
import { AutoMovieArchetypeUnits } from "./AutoMovieArchetypeUnits";

/**
 * The path a moving support follows and how fast it goes along it: straight
 * legs and circular turns with speeds, or a path timed by samples.
 *
 * A course of legs is what an author writes for a vehicle, a cart or a ridden
 * animal. Its curvature is piecewise constant, which is what lets a car's
 * steering angle, a motorcycle's lean and a crank's turn be read from it in
 * closed form, and its speed is the engine's `speedProfile`: without speed
 * marks, a constant acceleration from the start speed up to the cruising speed
 * and a constant braking to the end speed at the end of the last leg, which
 * from rest to rest is a trapezoid and on a course too short to cruise peaks
 * below the cruising speed; with a speed mark at each leg's end, each leg is
 * driven from the speed it starts at to its mark at the course's rates, holding
 * the faster of the two, so a car brakes late into a slow corner and
 * accelerates early out of it, and a leg between two stops runs up to the
 * cruising speed. A leg may climb or fall at a constant grade and may be driven
 * in reverse, and the support may stand at a stop for a pause. A timed course
 * instead passes through points at stated seconds (`timed`). Either form plans
 * into the same `IPlan`, which every ride reads.
 *
 * Headings are degrees about `+Y`: 0 faces `+Z` and a positive heading turns
 * toward `+X`, the left of someone facing `+Z`, so a positive turn is a left
 * turn.
 */
export namespace AutoMovieArchetypeCourse {
  /** One leg of a course. */
  export type Leg = IStraight | ITurn;

  /**
   * What every leg may carry beside its shape: a grade, a reversed drive and a
   * pause at its end.
   */
  export interface ILegBase {
    /**
     * Metres gained over the leg, negative for a descent; the grade, rise over
     * horizontal run, is constant along the leg, so the root climbs and pitches
     * with it. Absent, the leg is level.
     */
    rise?: number;

    /**
     * Whether the support goes backward along the leg, its facing kept: a car
     * backing out. Absent, it goes forward.
     */
    reverse?: boolean;

    /**
     * Seconds the support stands still at the leg's end before it drives on,
     * positive, allowed only where the leg's speed mark is 0 and another leg
     * follows. Absent, it drives on at once.
     */
    pause?: number;
  }

  /** A straight leg. */
  export interface IStraight extends ILegBase {
    /** The discriminator. */
    kind: "straight";

    /** Its horizontal length, metres, positive. */
    length: number;
  }

  /** A circular turn. */
  export interface ITurn extends ILegBase {
    /** The discriminator. */
    kind: "turn";

    /** The radius of the path seen from above, metres, positive. */
    radius: number;

    /**
     * The change of the support's heading, degrees, nonzero: positive to the
     * left.
     */
    angle: number;
  }

  /** A course of legs: where it starts, its legs and its speeds. */
  export interface ICourse {
    /**
     * The discriminator, which an author may leave out: a course of legs, told
     * from a plan (`IPlan.kind`) by it.
     */
    kind?: "course";

    /**
     * Where the support's root starts, metres on the floor, and its heading,
     * degrees.
     */
    start: ICourseStart;

    /** The legs in order, at least one. */
    legs: readonly Leg[];

    /**
     * The cruising speed, metres per second, positive: the top speed of a
     * course without speed marks, and of a leg between two stops.
     */
    cruise: number;

    /**
     * The acceleration, metres per second squared, positive; absent for a
     * course that never speeds up, such as one run at its cruising speed from
     * start to end, and refused as missing by `plan` when the course speeds
     * up.
     */
    acceleration?: number;

    /**
     * The braking, metres per second squared, positive; absent for a course
     * that never slows, and refused as missing by `plan` when the course
     * slows.
     */
    deceleration?: number;

    /**
     * The speed at each leg's end, metres per second, at least 0 (0 for a
     * stop), one per leg; the last is the end speed. Absent, the course is
     * driven at its cruising speed from `startSpeed` to `endSpeed`.
     */
    speeds?: readonly number[];

    /**
     * The speed at the start, metres per second, at least 0: above 0 for a
     * support already moving when the scene begins. Absent, 0.
     */
    startSpeed?: number;

    /**
     * The speed at the end of a course without speed marks, metres per second,
     * at least 0: above 0 for a support still moving when the scene ends.
     * Absent, 0.
     */
    endSpeed?: number;

    /**
     * The film second the course begins; before it the support holds at its
     * start. Absent, 0.
     */
    at?: number;
  }

  /** The start object of {@link ICourse}. */
  export type ICourseStart = { x: number; z: number; heading: number };

  /** One sample of a timed course: where the support's root is at a film second. */
  export interface ISample {
    /** The film second. */
    seconds: number;

    /** The root's X, metres. */
    x: number;

    /** The root's height, metres; 0 when absent. */
    y?: number;

    /** The root's Z, metres. */
    z: number;
  }

  /**
   * A course timed by samples: the support passes through each sample's point
   * at its second.
   */
  export interface ITimed {
    /** The discriminator: a timed course, told from a course of legs by it. */
    kind: "timed";

    /** The samples, at least two, their seconds strictly increasing. */
    samples: readonly ISample[];
  }

  /** The state of a support on its course at a second. */
  export interface IState {
    /** Distance travelled along the path, metres. */
    distance: number;

    /** Speed along the path, metres per second. */
    speed: number;

    /**
     * Distance travelled forward less distance travelled in reverse, metres:
     * what a road wheel rolls, as `distance` is what the path covers.
     */
    progress: number;

    /**
     * The path's signed curvature seen from above, one over metres: positive
     * where it bends to the left of the way the support travels, zero on a
     * straight leg.
     */
    curvature: number;

    /** Whether the support travels backward, facing against its motion. */
    reverse: boolean;

    /**
     * The root's placement in the world: on the path, facing the way the
     * support faces, pitched with the grade.
     */
    placement: IAutoMovieTransform;
  }

  /**
   * A stretch of a planned path where it bends, as a ride's limits judge it:
   * its least radius and the fastest it is taken, with the course fields a
   * refusal names.
   */
  export interface IBend {
    /**
     * The course field a refusal of the radius names: `course.legs[k].radius`,
     * or `samples[i]` for a timed course.
     */
    radiusField: string;

    /**
     * The course field a refusal of the speed names: the mark or rate that sets
     * the leg's top speed, `course.cruise` without marks, or `samples[i]`.
     */
    speedField: string;

    /** The least radius of the path seen from above, metres. */
    radius: number;

    /**
     * The fastest the bend is taken, metres per second: a leg's top speed as
     * the course bounds it, or a timed course's speed where it bends hardest.
     */
    speed: number;

    /**
     * The film second the bend begins, or for a timed course the second its
     * radius or its balance is worst.
     */
    seconds: number;
  }

  /**
   * One leg of a planned course: where it lies along the path and the fastest
   * it is taken.
   */
  export interface ILegSpan {
    /** The distance along the path where the leg begins, metres. */
    from: number;

    /** The leg's length along the path, its grade included, metres. */
    span: number;

    /** The greatest speed reached on the leg, metres per second. */
    fastest: number;
  }

  /** A course made ready to sample. */
  export interface IPlan {
    /**
     * The discriminator: a planned course, told from an unplanned one
     * (`ICourse.kind`) by it, so a ride taking either narrows by type, not by
     * which members it happens to have.
     */
    kind: "plan";

    /** The course, of legs or timed. */
    course: ICourse | ITimed;

    /** The path's length, metres. */
    length: number;

    /**
     * The film second the course ends: from 0, through any start second, to the
     * end.
     */
    duration: number;

    /** The greatest speed reached, metres per second. */
    peak: number;

    /**
     * Named instants in time order: `depart` where the course begins and `stop`
     * where it ends; without speed marks, `cruise` when the cruising speed is
     * reached and held and `brake` when the final braking starts, which on a
     * course too short to cruise is the peak; with speed marks, `leg<k>Start`
     * where the k-th leg from 1 begins after the first, and `stop<k>` and
     * `depart<k>` where the support stops at the end of the k-th leg and drives
     * on; `turn<k>Start` and `turn<k>End` for the k-th leg when it is a turn.
     */
    instants: readonly { seconds: number; label: string }[];

    /** Where the path bends, for the rides' limits. */
    bends: readonly IBend[];

    /**
     * Each leg's stretch of the path and the fastest it is taken, in the legs'
     * order; none for a timed course.
     */
    legSpans: readonly ILegSpan[];

    /**
     * The film second at which a distance along the path is first reached; a
     * distance before the start gives the start and one past the end the end.
     */
    when: (distance: number) => number;

    /**
     * The state at a second; before the course begins it is the start and after
     * it ends the end.
     */
    at: (seconds: number) => IState;
  }

  /**
   * The lean a single-track vehicle holds on its course: the angle from upright
   * at which gravity and the turn's centripetal pull balance.
   *
   * @param state The course's state.
   * @returns The lean, degrees, positive toward the vehicle's left; into a left
   *   turn going forward and, reversing, toward the path's left, which is the
   *   vehicle's right. Zero on a straight leg.
   */
  export function lean(state: IState): number {
    const balance: number =
      Math.atan(
        (state.speed * state.speed * state.curvature) /
          AutoMovieEngineGravity.STANDARD,
      ) / AutoMovieArchetypeUnits.DEGREE;
    return state.reverse ? -balance : balance;
  }

  /**
   * A course placement rolled about the direction the vehicle faces, for a
   * vehicle that leans.
   *
   * @param state The course's state.
   * @param degrees The lean, positive toward the vehicle's left.
   * @returns The root's placement: at the same point, facing the same way,
   *   leaned.
   */
  export function banked(state: IState, degrees: number): IAutoMovieTransform {
    return {
      translation: { ...state.placement.translation },
      rotation: AutoMovieEngineQuaternion.normalize(
        AutoMovieEngineQuaternion.multiply(
          state.placement.rotation,
          AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -degrees),
        ),
      ),
      scale: { ...AutoMovieArchetypeFrame.UNIT },
    };
  }

  /**
   * Admit a course for a single-track vehicle that cannot lean beyond a limit.
   *
   * @param archetype The name a refusal carries.
   * @param course The course, or its plan.
   * @param limit The greatest lean, degrees.
   * @throws {AutoMovieArchetypeRefusal} When a bend taken at the fastest its
   *   course lets it be taken needs more lean than the limit: without speed
   *   marks, at the turn's radius, giving the least radius at the cruising
   *   speed; with marks, at the mark that sets the leg's top speed, giving the
   *   fastest speed the turn allows; on a timed course, at the sample where the
   *   balance is worst, naming its second. As `plan` does for a malformed
   *   course.
   */
  export function admitLean(
    archetype: string,
    course: ICourse | IPlan,
    limit: number,
  ): void {
    const planned: IPlan =
      course.kind === "plan" ? course : plan(archetype, course);
    const tangent: number = Math.tan(limit * AutoMovieArchetypeUnits.DEGREE);
    for (const bend of planned.bends) {
      const least: number =
        (bend.speed * bend.speed) / (AutoMovieEngineGravity.STANDARD * tangent);
      if (!(bend.radius < least)) continue;

      // At the cruising speed the turn is what an author widens; at a mark or a timed sample, the speed is what they lower.
      if (bend.speedField === "course.cruise")
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype,
          axis: bend.radiusField,
          value: bend.radius,
          feasible: { kind: "range", minimum: least, maximum: null, unit: "m" },
          reason: `a ${bend.radius} m turn at ${bend.speed} m/s leans the ${archetype} past ${limit} degrees`,
          fix: "widen the turn or lower the cruising speed",
        });
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: bend.speedField,
        value: bend.speed,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: Math.sqrt(AutoMovieEngineGravity.STANDARD * tangent * bend.radius),
          unit: "m/s",
        },
        reason: `a ${bend.radius} m bend at ${bend.speed} m/s at ${bend.seconds} s leans the ${archetype} past ${limit} degrees`,
        fix: "lower the speed there or widen the bend",
      });
    }
  }

  /**
   * Admit a course for a support that cannot follow a path tighter than a least
   * radius, such as a car at its steering lock.
   *
   * @param archetype The name a refusal carries.
   * @param planned The course's plan.
   * @param least The least radius the support follows, metres.
   * @param reason Why, as a refusal states it after the radius, such as `needs
   *   more steering than the car's lock gives`.
   * @throws {AutoMovieArchetypeRefusal} At the first bend tighter than `least`:
   *   its radius field with the least radius, naming the second on a timed
   *   course.
   */
  export function admitRadius(
    archetype: string,
    planned: IPlan,
    least: number,
    reason: string,
  ): void {
    for (const bend of planned.bends)
      if (bend.radius < least)
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype,
          axis: bend.radiusField,
          value: bend.radius,
          feasible: { kind: "range", minimum: least, maximum: null, unit: "m" },
          reason: `a ${bend.radius} m ${bend.radiusField.startsWith("samples") ? `bend at ${bend.seconds} s` : "turn"} ${reason}`,
          fix: "widen the turn to at least the least radius",
        });
  }

  /**
   * A course of legs made ready to sample.
   *
   * @param archetype The name a refusal carries.
   * @param course The course.
   * @returns The plan; a course using none of the optional members plans to the
   *   same instants and states, bit for bit, as before they existed.
   * @throws {AutoMovieArchetypeRefusal} When the course has no leg, its start
   *   is not finite, a length, radius, cruising speed or given rate is not
   *   positive, a rate is missing where the course speeds up or slows, a turn's
   *   angle is zero, a grade or start second is not finite, a speed is
   *   negative, the speed marks do not give one per leg, `endSpeed` is given
   *   beside them, a mark or the end speed lies outside what its leg reaches
   *   from the speed before it (naming the reachable range), the start speed of
   *   a course without marks is above its cruising speed, or a pause is not
   *   positive or falls where the support does not stop.
   */
  export function plan(archetype: string, course: ICourse): IPlan {
    return ArchetypeCourseLegs.plan(archetype, course).plan;
  }

  /**
   * A timed course passes through every position at its film second, with
   * continuous speed and heading. Equal consecutive positions hold at zero
   * speed. An interior hold requires a common arrival and departure direction
   * to preserve its standing pose.
   *
   * @param archetype The name a refusal carries.
   * @param samples The samples, at least two, their seconds strictly
   *   increasing.
   * @returns The plan; the rides read it like any course, and refuse it where
   *   it bends or goes faster than they allow, naming the second.
   * @throws {AutoMovieArchetypeRefusal} When there are fewer than two samples,
   *   a value is not finite, seconds do not increase, or an interior hold
   *   cannot preserve its facing.
   */
  export function timed(archetype: string, samples: readonly ISample[]): IPlan {
    return ArchetypeCourseTimed.plan(archetype, samples);
  }
}
