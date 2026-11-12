import { Quaternion } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";

/**
 * The path a moving support follows on level ground and how fast it goes along it: straight legs and circular turns driven from rest to a cruising speed and back to rest.
 *
 * A course is what an author writes for a vehicle, a cart or a ridden animal. Its curvature is piecewise constant, which is what lets a car's steering angle, a motorcycle's lean and a crank's turn be read from it in closed form, and its speed is a trapezoid: a constant acceleration from rest, the cruising speed, a constant braking to rest at the end of the last leg. A course too short to reach the cruising speed peaks below it.
 *
 * Headings are degrees about `+Y`: 0 faces `+Z` and a positive heading turns toward `+X`, the left of someone facing `+Z`, so a positive turn is a left turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a course is, why its curvature is piecewise constant, the speed profile and the heading convention.
 * @evidence contracts/development/design.md#principled-representation An arc-and-line path with a trapezoidal speed profile, the tangent-continuous path of road alignment whose state at any second is closed-form: distance from the profile, position and heading from the leg.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The course record, its plan and one sampler, which every ride of this package reads, with `lean`, `banked` and `admitLean` for the single-track rides that lean into a turn; the motion grammar's ride relation reads the same plan for the rider (#3352).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Legs are a discriminated union, so a straight leg cannot carry a radius.
 */
export namespace ArchetypeCourse {
  /**
   * One leg of a course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A leg is either straight or a turn, discriminated by `kind`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; read by `plan` and by the rides that check each turn.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A discriminated union, not one record with an optional radius and angle.
   */
  export type Leg = IStraight | ITurn;

  /**
   * A straight leg.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A straight leg by its positive length in metres; `plan` refuses a length that is not.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; one of the two alternatives of `Leg`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no radius or angle, so a straight cannot turn.
   */
  export interface IStraight {
    /** The discriminator. */
    kind: "straight";

    /** Its length, metres, positive. */
    length: number;
  }

  /**
   * A circular turn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A circular arc by its positive radius in metres and its nonzero signed angle in degrees, positive to the left; `plan` refuses either when malformed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; one of the two alternatives of `Leg`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The direction is the angle's sign, not a second member that could disagree with it.
   */
  export interface ITurn {
    /** The discriminator. */
    kind: "turn";

    /** The radius of the path, metres, positive. */
    radius: number;

    /** The change of heading, degrees, nonzero: positive to the left. */
    angle: number;
  }

  /**
   * A course: where it starts, its legs and its speeds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A start pose on the floor in metres and degrees, legs in order, and three positive rates in metres per second and metres per second squared; positivity and finiteness are left to `plan`, which refuses.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; authored by a scene and read by `plan` and by each ride.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: legs are a discriminated union and nothing is optional.
   */
  export interface ICourse {
    /** Where the support's root starts, metres on the floor, and its heading, degrees. */
    start: { x: number; z: number; heading: number };

    /** The legs in order, at least one. */
    legs: readonly Leg[];

    /** The cruising speed, metres per second, positive. */
    cruise: number;

    /** The acceleration from rest, metres per second squared, positive. */
    acceleration: number;

    /** The braking to rest, metres per second squared, positive. */
    deceleration: number;
  }

  /**
   * The state of a support on its course at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation Where a support is at one second: distance in metres, speed in metres per second, signed curvature per metre (positive to the left) and the root's placement in the world with unit scale.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; produced by a plan's `at` and read by each ride's pose function, `lean` and `banked`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None; the placement is the interface package's transform.
   */
  export interface IState {
    /** Distance travelled along the path, metres. */
    distance: number;

    /** Speed along the path, metres per second. */
    speed: number;

    /** The path's signed curvature, one over metres: positive in a left turn, zero on a straight leg. */
    curvature: number;

    /** The root's placement in the world: on the floor, facing along the path. */
    placement: IAutoMovieTransform;
  }

  /**
   * A course made ready to sample.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A course with its closed-form timing: length in metres, duration in seconds, peak speed, labelled instants in time order, and two samplers that are pure functions of distance and of seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `plan` and read by every ride and by `ArchetypeRide`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: plain data and two functions, no optional member.
   */
  export interface IPlan {
    /** The course. */
    course: ICourse;

    /** The path's length, metres. */
    length: number;

    /** The running time, seconds, from departure to the stop. */
    duration: number;

    /** The greatest speed reached, metres per second. */
    peak: number;

    /** Named instants in time order: `depart`; `cruise`, when the cruising speed is reached and held; `brake`, when braking starts, which on a course too short to cruise is the peak; `turn<k>Start` and `turn<k>End` for the k-th leg from 1 when it is a turn; and `stop`. */
    instants: readonly { seconds: number; label: string }[];

    /**
     * The second at which a distance along the path, metres, is reached; a distance before the start gives 0 and one past the end the running time.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit and what is returned outside the course's range.
     * @evidence contracts/development/implementation.md#principled-implementation The trapezoid's three phases inverted in closed form: a square root while accelerating and while braking, a division while cruising.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per phase.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A distance outside the path is held at its nearer end, never extrapolated.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the phase boundaries `plan` computed once.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the plan's own closure.
     */
    when: (distance: number) => number;

    /**
     * The state at a second; before departure it is the start and after the stop the end.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument's unit and what is returned outside the course's range.
     * @evidence contracts/development/implementation.md#principled-implementation Distance and speed from the trapezoid in closed form, then the leg that holds that distance, advanced along its line or its arc.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Time to distance, distance to leg, leg to placement.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A second outside the running time holds the nearer end state, never extrapolated.
     * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the legs, a handful for any real course.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the leg table `plan` computed once.
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
   * @returns The lean, degrees, positive toward the left, into a left turn; zero on a straight leg.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the balance, the unit and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation The steady-turn balance of a point mass on a thin tyre, the arctangent of speed squared times curvature over gravity (Wikipedia, Bicycle and motorcycle dynamics, after Fajans 2000 and Cossalter, https://en.wikipedia.org/wiki/Bicycle_and_motorcycle_dynamics, not read at the primary); a real tyre's width adds a few degrees, left out.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lean(state: IState): number {
    return (
      (Math.atan((state.speed * state.speed * state.curvature) / GRAVITY) *
        180) /
      Math.PI
    );
  }

  /**
   * A course placement rolled about the direction of travel, for a vehicle that leans.
   *
   * @param state The course's state.
   * @param degrees The lean, positive toward the left.
   * @returns The root's placement: at the same point of the floor, facing along the path, leaned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is kept and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation The heading's rotation followed, in the vehicle's own frame, by a roll about its forward axis `+Z`; a right-handed roll about `+Z` tips `+Y` toward `-X`, the right, so a lean to the left is the negative roll.
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
   * @param course The course.
   * @param limit The greatest lean, degrees.
   * @throws {ArchetypeRefusal} When a turn taken at the cruising speed needs more lean than the limit, giving the least radius at that speed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the limit's unit and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The balance of `lean` solved for the radius: the cruising speed squared over gravity times the tangent of the limit. The cruising speed is the fastest the course lets a turn be taken, so a turn admitted here leans within the limit at every second.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One least radius, one pass over the legs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A turn beyond the limit is refused, never flattened.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the legs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure check.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function admitLean(
    archetype: string,
    course: ICourse,
    limit: number,
  ): void {
    const least: number =
      (course.cruise * course.cruise) /
      (GRAVITY * Math.tan((limit * Math.PI) / 180));
    course.legs.forEach((leg: Leg, index: number): void => {
      if (leg.kind === "turn" && leg.radius < least)
        throw new ArchetypeRefusal({
          kind: "parameter",
          archetype,
          axis: `course.legs[${index}].radius`,
          value: leg.radius,
          feasible: { kind: "range", minimum: least, maximum: null, unit: "m" },
          reason: `a ${leg.radius} m turn at ${course.cruise} m/s leans the ${archetype} past ${limit} degrees`,
          fix: "widen the turn or lower the cruising speed",
        });
    });
  }

  /**
   * A course made ready to sample.
   *
   * @param archetype The name a refusal carries.
   * @param course The course.
   * @returns The plan.
   * @throws {ArchetypeRefusal} When the course has no leg, its start is not finite, a length, radius, speed or rate is not positive, or a turn's angle is zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The trapezoid's three phases integrate in closed form (distance is half the acceleration times the time squared, then speed times time, then the mirrored braking), and a short course lowers the peak to the speed at which accelerating and braking distances meet; a turn's position is the arc about its centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the course, measure the legs, time the profile, then the two samplers over those tables.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A second outside the running time holds the nearest end state; nothing is extrapolated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning is linear in the legs; a sample scans the legs once, a handful for any real course.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One plan serves every sample of a ride.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the course and one table row per leg for as long as its caller keeps it.
   */
  export function plan(archetype: string, course: ICourse): IPlan {
    const refuse = (axis: string, value: unknown, reason: string): never => {
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: `course.${axis}`,
        value,
        feasible: null,
        reason,
        fix: "give the course a finite start, positive lengths, radii, speeds and rates, and nonzero turns",
      });
    };
    if (course.legs.length === 0) refuse("legs", 0, "a course needs a leg");
    for (const name of ["x", "z", "heading"] as const)
      if (!Number.isFinite(course.start[name]))
        refuse(`start.${name}`, course.start[name], "the start must be finite");
    for (const [name, value] of [
      ["cruise", course.cruise],
      ["acceleration", course.acceleration],
      ["deceleration", course.deceleration],
    ] as const)
      if (!(Number.isFinite(value) && value > 0))
        refuse(name, value, `${name} must be positive`);

    // Each leg's length and the heading and place it starts from.
    const rows: IRow[] = [];
    let x: number = course.start.x;
    let z: number = course.start.z;
    let heading: number = course.start.heading;
    let length: number = 0;
    course.legs.forEach((leg: Leg, index: number): void => {
      const size: number = leg.kind === "straight" ? leg.length : leg.radius;
      if (!(Number.isFinite(size) && size > 0))
        refuse(
          `legs[${index}]`,
          size,
          "a leg's length or radius must be positive",
        );
      if (
        leg.kind === "turn" &&
        !(Number.isFinite(leg.angle) && leg.angle !== 0)
      )
        refuse(
          `legs[${index}].angle`,
          leg.angle,
          "a turn must change the heading",
        );
      const span: number =
        leg.kind === "straight"
          ? leg.length
          : (leg.radius * Math.abs(leg.angle) * Math.PI) / 180;
      const row: IRow = { leg, from: length, span, x, z, heading };
      rows.push(row);
      const end: { x: number; z: number; heading: number } = advance(row, span);
      x = end.x;
      z = end.z;
      heading = end.heading;
      length += span;
    });

    // The trapezoid: accelerate, cruise, brake; a short course peaks where the two ramps meet.
    const a: number = course.acceleration;
    const b: number = course.deceleration;
    const peak: number = Math.min(
      course.cruise,
      Math.sqrt((2 * length * a * b) / (a + b)),
    );
    const up: number = peak / a;
    const down: number = peak / b;
    const upDistance: number = (peak * up) / 2;
    const downDistance: number = (peak * down) / 2;
    const level: number = (length - upDistance - downDistance) / peak;
    const duration: number = up + level + down;
    const travelled = (
      seconds: number,
    ): { distance: number; speed: number } => {
      const t: number = Math.max(0, Math.min(duration, seconds));
      if (t <= up) return { distance: (a * t * t) / 2, speed: a * t };
      if (t <= up + level)
        return { distance: upDistance + peak * (t - up), speed: peak };
      const left: number = duration - t;
      return { distance: length - (b * left * left) / 2, speed: b * left };
    };
    const when = (distance: number): number => {
      const s: number = Math.max(0, Math.min(length, distance));
      if (s <= upDistance) return Math.sqrt((2 * s) / a);
      if (s <= length - downDistance) return up + (s - upDistance) / peak;
      return duration - Math.sqrt((2 * (length - s)) / b);
    };

    const instants: { seconds: number; label: string }[] = [
      { seconds: 0, label: "depart" },
    ];
    if (level > 1e-9) instants.push({ seconds: up, label: "cruise" });
    instants.push({ seconds: up + Math.max(0, level), label: "brake" });
    rows.forEach((row: IRow, index: number): void => {
      if (row.leg.kind !== "turn") return;
      instants.push({
        seconds: when(row.from),
        label: `turn${index + 1}Start`,
      });
      instants.push({
        seconds: when(row.from + row.span),
        label: `turn${index + 1}End`,
      });
    });
    instants.push({ seconds: duration, label: "stop" });
    instants.sort(
      (p: { seconds: number }, q: { seconds: number }): number =>
        p.seconds - q.seconds,
    );

    return {
      course,
      length,
      duration,
      peak,
      instants,
      when,
      at: (seconds: number): IState => {
        const { distance, speed }: { distance: number; speed: number } =
          travelled(seconds);
        let row: IRow = rows[0]!;
        for (const candidate of rows)
          if (distance >= candidate.from) row = candidate;
        const pose: { x: number; z: number; heading: number } = advance(
          row,
          Math.min(row.span, distance - row.from),
        );
        return {
          distance,
          speed,
          curvature:
            row.leg.kind === "turn"
              ? Math.sign(row.leg.angle) / row.leg.radius
              : 0,
          placement: {
            translation: { x: pose.x, y: 0, z: pose.z },
            rotation: Quaternion.fromAxisAngle(
              { x: 0, y: 1, z: 0 },
              pose.heading,
            ),
            scale: { ...ArchetypeFrame.UNIT },
          },
        };
      },
    };
  }
}

/** One leg with where it starts. */
interface IRow {
  /** The leg. */
  leg: ArchetypeCourse.Leg;

  /** Distance along the path at which the leg starts, metres. */
  from: number;

  /** The leg's length along the path, metres. */
  span: number;

  /** The root's X where the leg starts, metres. */
  x: number;

  /** The root's Z where the leg starts, metres. */
  z: number;

  /** The heading where the leg starts, degrees. */
  heading: number;
}

/**
 * Where a leg has taken the root after a distance along it.
 *
 * @param row The leg and its start.
 * @param distance Distance along the leg, metres, from 0 to its span.
 * @returns The root's place and heading.
 */
function advance(
  row: IRow,
  distance: number,
): { x: number; z: number; heading: number } {
  const h: number = (row.heading * Math.PI) / 180;
  if (row.leg.kind === "straight")
    return {
      x: row.x + distance * Math.sin(h),
      z: row.z + distance * Math.cos(h),
      heading: row.heading,
    };

  // Forward is (sin h, cos h) on (X, Z) and left is (cos h, -sin h); the centre lies a radius to the turning side.
  const side: number = Math.sign(row.leg.angle);
  const swept: number = (side * distance) / row.leg.radius;
  const cx: number = row.x + side * row.leg.radius * Math.cos(h);
  const cz: number = row.z - side * row.leg.radius * Math.sin(h);
  return {
    x: cx - side * row.leg.radius * Math.cos(h + swept),
    z: cz + side * row.leg.radius * Math.sin(h + swept),
    heading: row.heading + (swept * 180) / Math.PI,
  };
}
