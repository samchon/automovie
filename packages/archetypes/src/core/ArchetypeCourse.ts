import { Quaternion } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import { ArchetypeCourseLegs } from "./ArchetypeCourseLegs";
import { ArchetypeCourseTimed } from "./ArchetypeCourseTimed";
import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";

/**
 * The path a moving support follows and how fast it goes along it: straight legs and circular turns with speeds, or a path timed by samples.
 *
 * A course of legs is what an author writes for a vehicle, a cart or a ridden animal. Its curvature is piecewise constant, which is what lets a car's steering angle, a motorcycle's lean and a crank's turn be read from it in closed form, and its speed is the engine's `speedProfile`: without speed marks, a constant acceleration from the start speed up to the cruising speed and a constant braking to the end speed at the end of the last leg, which from rest to rest is a trapezoid and on a course too short to cruise peaks below the cruising speed; with a speed mark at each leg's end, each leg is driven from the speed it starts at to its mark at the course's rates, holding the faster of the two, so a car brakes late into a slow corner and accelerates early out of it, and a leg between two stops runs up to the cruising speed. A leg may climb or fall at a constant grade and may be driven in reverse, and the support may stand at a stop for a pause. A timed course instead passes through points at stated seconds (`timed`). Either form plans into the same `IPlan`, which every ride reads.
 *
 * Headings are degrees about `+Y`: 0 faces `+Z` and a positive heading turns toward `+X`, the left of someone facing `+Z`, so a positive turn is a left turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a course is, why its curvature is piecewise constant, the speed profile with and without marks, grades, reversing, pauses, the timed form and the heading convention.
 * @evidence contracts/development/design.md#principled-representation An arc-and-line path with a profile of piecewise-constant acceleration, the tangent-continuous path of road alignment whose state at any second is closed-form: distance from the profile, position and heading from the leg; or a C1 path through timed samples. Both plan into one record with pure samplers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The course records, their plans and samplers, which every ride of this package reads, with `lean`, `banked`, `admitLean` and `admitRadius` for the rides that lean into a turn or steer at a lock; the motion grammar's ride relation reads the same plan for the rider (#3352). The speed profile itself is the engine's (#3493, P13 on #3503).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Legs are a discriminated union, so a straight leg cannot carry a radius; speeds are never negative, reversing being a leg's flag, so curvature and lean keep their signs' meanings.
 */
export namespace ArchetypeCourse {
  /**
   * One leg of a course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A leg is either straight or a turn, discriminated by `kind`, each with the members every leg may carry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; read by `plan` and by the rides that check each turn.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A discriminated union, not one record with an optional radius and angle.
   */
  export type Leg = IStraight | ITurn;

  /**
   * What every leg may carry beside its shape: a grade, a reversed drive and a pause at its end.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit, default and the rule it obeys.
   * @evidence contracts/development/design.md#principled-representation A rise in metres over the leg's horizontal run, a flag for driving backward along it, and a pause in seconds; `plan` refuses one that is malformed or a pause where the support does not stop.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the members #3493 asks every leg to take, read by `plan` and by the rides that reverse or refuse reversing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reversing is a flag, never a negative speed, so a speed keeps its meaning.
   */
  export interface ILegBase {
    /** Metres gained over the leg, negative for a descent; the grade, rise over horizontal run, is constant along the leg, so the root climbs and pitches with it. Absent, the leg is level. */
    rise?: number;

    /** Whether the support goes backward along the leg, its facing kept: a car backing out. Absent, it goes forward. */
    reverse?: boolean;

    /** Seconds the support stands still at the leg's end before it drives on, positive, allowed only where the leg's speed mark is 0 and another leg follows. Absent, it drives on at once. */
    pause?: number;
  }

  /**
   * A straight leg.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A straight leg by its positive horizontal length in metres; `plan` refuses a length that is not.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; one of the two alternatives of `Leg`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no radius or angle, so a straight cannot turn.
   */
  export interface IStraight extends ILegBase {
    /** The discriminator. */
    kind: "straight";

    /** Its horizontal length, metres, positive. */
    length: number;
  }

  /**
   * A circular turn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A circular arc by its positive horizontal radius in metres and its nonzero signed angle in degrees, positive to the left; `plan` refuses either when malformed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; one of the two alternatives of `Leg`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The direction is the angle's sign, not a second member that could disagree with it.
   */
  export interface ITurn extends ILegBase {
    /** The discriminator. */
    kind: "turn";

    /** The radius of the path seen from above, metres, positive. */
    radius: number;

    /** The change of the support's heading, degrees, nonzero: positive to the left. */
    angle: number;
  }

  /**
   * A course of legs: where it starts, its legs and its speeds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit, default or meaning.
   * @evidence contracts/development/design.md#principled-representation A start pose on the floor in metres and degrees, legs in order, three positive rates in metres per second and metres per second squared, and the optional marks: a speed at each leg's end, start and end speeds and a start second. Every optional member's absence plans as a course without it did; ranges, the marks' count and their reachability are left to `plan`, which refuses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; authored by a scene and read by `plan` and by each ride.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `endSpeed` and `speeds` both name the speed at the course's end, so `plan` refuses the two together rather than choosing one.
   */
  export interface ICourse {
    /** Where the support's root starts, metres on the floor, and its heading, degrees. */
    start: { x: number; z: number; heading: number };

    /** The legs in order, at least one. */
    legs: readonly Leg[];

    /** The cruising speed, metres per second, positive: the top speed of a course without speed marks, and of a leg between two stops. */
    cruise: number;

    /** The acceleration, metres per second squared, positive. */
    acceleration: number;

    /** The braking, metres per second squared, positive. */
    deceleration: number;

    /** The speed at each leg's end, metres per second, at least 0 (0 for a stop), one per leg; the last is the end speed. Absent, the course is driven at its cruising speed from `startSpeed` to `endSpeed`. */
    speeds?: readonly number[];

    /** The speed at the start, metres per second, at least 0: above 0 for a support already moving when the scene begins. Absent, 0. */
    startSpeed?: number;

    /** The speed at the end of a course without speed marks, metres per second, at least 0: above 0 for a support still moving when the scene ends. Absent, 0. */
    endSpeed?: number;

    /** The film second the course begins; before it the support holds at its start. Absent, 0. */
    at?: number;
  }

  /**
   * One sample of a timed course: where the support's root is at a film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit.
   * @evidence contracts/development/design.md#principled-representation A point in metres at a film second; finiteness and order are left to `timed`, which refuses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; an entry of `ITimed.samples`, such as a formation slot's path (#3458).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
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
   * A course timed by samples: the support passes through each sample's point at its second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is.
   * @evidence contracts/development/design.md#principled-representation The samples in time order; `timed` plans them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the `course` of a timed plan.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITimed {
    /** The samples, at least two, their seconds strictly increasing. */
    samples: readonly ISample[];
  }

  /**
   * The state of a support on its course at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation Where a support is at one second: distance in metres along the path, speed in metres per second never negative, signed curvature of the path seen from above per metre (positive where the path bends to the left of the way the support travels), whether it travels backward, and the root's placement in the world with unit scale.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; produced by a plan's `at` and read by each ride's pose function, `lean` and `banked`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None; the placement is the interface package's transform.
   */
  export interface IState {
    /** Distance travelled along the path, metres. */
    distance: number;

    /** Speed along the path, metres per second. */
    speed: number;

    /** The path's signed curvature seen from above, one over metres: positive where it bends to the left of the way the support travels, zero on a straight leg. */
    curvature: number;

    /** Whether the support travels backward, facing against its motion. */
    reverse: boolean;

    /** The root's placement in the world: on the path, facing the way the support faces, pitched with the grade. */
    placement: IAutoMovieTransform;
  }

  /**
   * A stretch of a planned path where it bends, as a ride's limits judge it: its least radius and the fastest it is taken, with the course fields a refusal names.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and which field each refusal names.
   * @evidence contracts/development/design.md#principled-representation A radius in metres and a speed in metres per second, the inputs of the steady-turn balance and of a steering lock, with the course fields at fault.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; listed by a plan and read by `admitLean` and `admitRadius`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IBend {
    /** The course field a refusal of the radius names: `course.legs[k].radius`, or `samples[i]` for a timed course. */
    radiusField: string;

    /** The course field a refusal of the speed names: the mark or rate that sets the leg's top speed, `course.cruise` without marks, or `samples[i]`. */
    speedField: string;

    /** The least radius of the path seen from above, metres. */
    radius: number;

    /** The fastest the bend is taken, metres per second: a leg's top speed as the course bounds it, or a timed course's speed where it bends hardest. */
    speed: number;

    /** The film second the bend begins, or for a timed course the second its radius or its balance is worst. */
    seconds: number;
  }

  /**
   * A course made ready to sample.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A course with its timing: length in metres, the second it ends, peak speed, labelled instants in time order, its bends, and two samplers that are pure functions of distance and of seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `plan` and `timed` and read by every ride and by `ArchetypeRide`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: plain data and two functions.
   */
  export interface IPlan {
    /** The course, of legs or timed. */
    course: ICourse | ITimed;

    /** The path's length, metres. */
    length: number;

    /** The film second the course ends: from 0, through any start second, to the end. */
    duration: number;

    /** The greatest speed reached, metres per second. */
    peak: number;

    /**
     * Named instants in time order: `depart` where the course begins and `stop` where it ends; without speed marks, `cruise` when the cruising speed is reached and held and `brake` when the final braking starts, which on a course too short to cruise is the peak; with speed marks, `leg<k>Start` where the k-th leg from 1 begins after the first, and `stop<k>` and `depart<k>` where the support stops at the end of the k-th leg and drives on; `turn<k>Start` and `turn<k>End` for the k-th leg when it is a turn.
     */
    instants: readonly { seconds: number; label: string }[];

    /** Where the path bends, for the rides' limits. */
    bends: readonly IBend[];

    /**
     * The film second at which a distance along the path is first reached; a distance before the start gives the start and one past the end the end.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit and what is returned outside the course's range.
     * @evidence contracts/development/implementation.md#principled-implementation The speed profile inverted in closed form for a course of legs, or the arc length inverted by Newton's method for a timed one.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of the planner's inverse.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A distance outside the path is held at its nearer end, never extrapolated.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per phase or table row searched.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the tables the planner computed once.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the plan's own closure.
     */
    when: (distance: number) => number;

    /**
     * The state at a second; before the course begins it is the start and after it ends the end.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit and what is returned outside the course's range.
     * @evidence contracts/development/implementation.md#principled-implementation Distance and speed from the profile, then the leg that holds that distance advanced along its line or arc; or the timed path's interpolation at that second.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Time to distance, distance to leg, leg to placement.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A second outside the course holds the nearer end state, never extrapolated.
     * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the legs or a search of the samples.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the tables the planner computed once.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the plan's own closure.
     */
    at: (seconds: number) => IState;
  }

  /** Standard gravity, metres per second squared. */
  export const GRAVITY: number = 9.80665;

  /**
   * The lean a single-track vehicle holds on its course: the angle from upright at which gravity and the turn's centripetal pull balance.
   *
   * @param state The course's state.
   * @returns The lean, degrees, positive toward the vehicle's left; into a left turn going forward and, reversing, toward the path's left, which is the vehicle's right. Zero on a straight leg.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the balance, the unit and the sign, reversing included.
   * @evidence contracts/development/implementation.md#principled-implementation The steady-turn balance of a point mass on a thin tyre, the arctangent of speed squared times curvature over gravity (Wikipedia, Bicycle and motorcycle dynamics, after Fajans 2000 and Cossalter, https://en.wikipedia.org/wiki/Bicycle_and_motorcycle_dynamics, not read at the primary); a real tyre's width adds a few degrees, left out. The pull is toward the path's inside, which a reversing vehicle has on its other side.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression and its side.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lean(state: IState): number {
    const balance: number =
      (Math.atan((state.speed * state.speed * state.curvature) / GRAVITY) *
        180) /
      Math.PI;
    return state.reverse ? -balance : balance;
  }

  /**
   * A course placement rolled about the direction the vehicle faces, for a vehicle that leans.
   *
   * @param state The course's state.
   * @param degrees The lean, positive toward the vehicle's left.
   * @returns The root's placement: at the same point, facing the same way, leaned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is kept and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation The placement's rotation followed, in the vehicle's own frame, by a roll about its forward axis `+Z`; a right-handed roll about `+Z` tips `+Y` toward `-X`, the right, so a lean to the left is the negative roll.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One quaternion product.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's quaternion arithmetic.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function banked(state: IState, degrees: number): IAutoMovieTransform {
    return {
      translation: { ...state.placement.translation },
      rotation: Quaternion.normalize(
        Quaternion.multiply(
          state.placement.rotation,
          Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -degrees),
        ),
      ),
      scale: { ...ArchetypeFrame.UNIT },
    };
  }

  /**
   * Admit a course for a single-track vehicle that cannot lean beyond a limit.
   *
   * @param archetype The name a refusal carries.
   * @param course The course, or its plan.
   * @param limit The greatest lean, degrees.
   * @throws {ArchetypeRefusal} When a bend taken at the fastest its course lets it be taken needs more lean than the limit: without speed marks, at the turn's radius, giving the least radius at the cruising speed; with marks, at the mark that sets the leg's top speed, giving the fastest speed the turn allows; on a timed course, at the sample where the balance is worst, naming its second. As `plan` does for a malformed course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the limit's unit and each refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The balance of `lean` solved for the radius, the speed squared over gravity times the tangent of the limit, or for the speed, the square root of gravity times the radius times that tangent. A leg's top speed bounds every second of it, so a bend admitted here leans within the limit throughout.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan unless planned, then one pass over the bends.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bend beyond the limit is refused, never flattened.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the bends.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads a plan the caller already has.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function admitLean(
    archetype: string,
    course: ICourse | IPlan,
    limit: number,
  ): void {
    const planned: IPlan = "legs" in course ? plan(archetype, course) : course;
    const tangent: number = Math.tan((limit * Math.PI) / 180);
    for (const bend of planned.bends) {
      const least: number = (bend.speed * bend.speed) / (GRAVITY * tangent);
      if (!(bend.radius < least)) continue;

      // At the cruising speed the turn is what an author widens; at a mark or a timed sample, the speed is what they lower.
      if (bend.speedField === "course.cruise")
        throw new ArchetypeRefusal({
          kind: "parameter",
          archetype,
          axis: bend.radiusField,
          value: bend.radius,
          feasible: { kind: "range", minimum: least, maximum: null, unit: "m" },
          reason: `a ${bend.radius} m turn at ${bend.speed} m/s leans the ${archetype} past ${limit} degrees`,
          fix: "widen the turn or lower the cruising speed",
        });
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: bend.speedField,
        value: bend.speed,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: Math.sqrt(GRAVITY * tangent * bend.radius),
          unit: "m/s",
        },
        reason: `a ${bend.radius} m bend at ${bend.speed} m/s at ${bend.seconds} s leans the ${archetype} past ${limit} degrees`,
        fix: "lower the speed there or widen the bend",
      });
    }
  }

  /**
   * Admit a course for a support that cannot follow a path tighter than a least radius, such as a car at its steering lock.
   *
   * @param archetype The name a refusal carries.
   * @param planned The course's plan.
   * @param least The least radius the support follows, metres.
   * @param reason Why, as a refusal states it after the radius, such as `needs more steering than the car's lock gives`.
   * @throws {ArchetypeRefusal} At the first bend tighter than `least`: its radius field with the least radius, naming the second on a timed course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A comparison of each bend's least radius with the support's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the bends.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bend beyond the limit is refused, never widened.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the bends.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the caller's plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function admitRadius(
    archetype: string,
    planned: IPlan,
    least: number,
    reason: string,
  ): void {
    for (const bend of planned.bends)
      if (bend.radius < least)
        throw new ArchetypeRefusal({
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
   * @returns The plan; a course using none of the optional members plans to the same instants and states, bit for bit, as before they existed.
   * @throws {ArchetypeRefusal} When the course has no leg, its start is not finite, a length, radius, cruising speed or rate is not positive, a turn's angle is zero, a grade or start second is not finite, a speed is negative, the speed marks do not give one per leg, `endSpeed` is given beside them, a mark or the end speed lies outside what its leg reaches from the speed before it (naming the reachable range), the start speed of a course without marks is above its cruising speed, or a pause is not positive or falls where the support does not stop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bit-for-bit promise and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation `ArchetypeCourseLegs.plan`: the legs measured on the ground and along their grade, the engine's speed profile over them, and each sample advanced along its leg's line or arc.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of the module that owns the legs' geometry.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the owner it calls.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms As `ArchetypeCourseLegs.plan`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One plan serves every sample of a ride.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the course and one table row per leg for as long as its caller keeps it.
   */
  export function plan(archetype: string, course: ICourse): IPlan {
    return ArchetypeCourseLegs.plan(archetype, course);
  }

  /**
   * A course read from a timed path: the support passes through each sample's point at its second, with continuous speed and heading.
   *
   * @param archetype The name a refusal carries.
   * @param samples The samples, at least two, their seconds strictly increasing.
   * @returns The plan; the rides read it like any course, and refuse it where it bends or goes faster than they allow, naming the second.
   * @throws {ArchetypeRefusal} When there are fewer than two samples, a value is not finite, or the seconds do not increase.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the plan does with the samples and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation `ArchetypeCourseTimed.plan`: a C1 cubic Hermite interpolation of each coordinate in time.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of the module that owns the timed path.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the owner it calls.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms As `ArchetypeCourseTimed.plan`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One plan serves every sample of a ride.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the samples and its arc-length table for as long as its caller keeps it.
   */
  export function timed(archetype: string, samples: readonly ISample[]): IPlan {
    return ArchetypeCourseTimed.plan(archetype, samples);
  }
}
