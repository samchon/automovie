import { Quaternion, speedProfile } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import type { ArchetypeCourse } from "./ArchetypeCourse";
import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";

/**
 * How a course of legs is planned: its legs measured and placed end to end, its speed marks admitted and handed to the engine's speed profile, and each second's state read back from the leg that holds it.
 *
 * `ArchetypeCourse.plan` is its one caller; the module exists so the course's types and the rides' checks stay apart from the legs' geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it owns and who calls it.
 * @evidence contracts/development/design.md#principled-representation The legs as a table of rows, each with its start, its run on the ground and its length along its grade.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, `plan`, called by `ArchetypeCourse.plan`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace ArchetypeCourseLegs {
  /**
   * A course of legs made ready to sample, as `ArchetypeCourse.plan` documents it.
   *
   * @param archetype The name a refusal carries.
   * @param course The course.
   * @returns The plan.
   * @throws {ArchetypeRefusal} As `ArchetypeCourse.plan` states.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Points to the documented caller, which states the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Each leg's run on the ground is its length or its radius times its angle, and its length along the path that run times the square root of one plus the grade squared, the hypotenuse of a constant grade. The speed is the engine's `speedProfile` over one distance stretch per leg with marks (topped at the faster of the leg's two marks, or at the cruising speed between two stops) or one stretch over the whole path without (topped at the cruising speed), each pause a seconds stretch at rest. A turn's position is the arc about its centre; a reversed leg advances along the facing's opposite with the facing kept, and the root pitches nose up by the arctangent of the grade in the direction it travels. A course using none of the optional members goes through the same operations in the same order as before they existed: the profile's single stretch from rest to rest reproduces the trapezoid's arithmetic, a level leg skips the grade's scaling and pitch, and a forward leg the reversal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the course, measure the legs, lay the profile, name the instants and the bends, then the two samplers over those tables.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable mark is refused with its reachable range, never clamped; a second outside the course holds the nearest end state.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning is linear in the legs; a sample scans the legs and the profile's phases once, a handful for any real course.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One plan serves every sample of a ride.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the course, one row per leg and the profile for as long as its caller keeps it.
   */
  export function plan(
    archetype: string,
    course: ArchetypeCourse.ICourse,
  ): ArchetypeCourse.IPlan {
    const refuse = (
      axis: string,
      value: unknown,
      reason: string,
      feasible: ArchetypeRefusal.Feasible | null = null,
      fix: string = "give the course a finite start, positive lengths, radii, speeds and rates, and nonzero turns",
    ): never => {
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: `course.${axis}`,
        value,
        feasible,
        reason,
        fix,
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

    // Each leg's run, its length along the grade, and the place and heading it starts from.
    const rows: IRow[] = [];
    let x: number = course.start.x;
    let y: number = 0;
    let z: number = course.start.z;
    let heading: number = course.start.heading;
    let length: number = 0;
    course.legs.forEach((leg: ArchetypeCourse.Leg, index: number): void => {
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
      const rise: number = leg.rise ?? 0;
      if (!Number.isFinite(rise))
        refuse(`legs[${index}].rise`, rise, "a leg's rise must be finite");
      const run: number =
        leg.kind === "straight"
          ? leg.length
          : (leg.radius * Math.abs(leg.angle) * Math.PI) / 180;
      const span: number =
        rise === 0 ? run : run * Math.sqrt(1 + (rise / run) * (rise / run));
      const row: IRow = {
        leg,
        from: length,
        span,
        run,
        rise,
        reverse: leg.reverse === true,
        x,
        y,
        z,
        heading,
      };
      rows.push(row);
      const end: IPose = advance(row, span);
      x = end.x;
      y = end.y;
      z = end.z;
      heading = end.heading;
      length += span;
    });

    // The speed marks, each reachable from the one before it.
    const at: number = course.at ?? 0;
    const startSpeed: number = course.startSpeed ?? 0;
    if (!Number.isFinite(at))
      refuse("at", at, "the start second must be finite");
    for (const [name, value] of [
      ["startSpeed", startSpeed],
      ["endSpeed", course.endSpeed ?? 0],
    ] as const)
      if (!(Number.isFinite(value) && value >= 0))
        refuse(name, value, `${name} must be finite and not negative`);
    const marks: readonly number[] | undefined = course.speeds;
    const stretches: speedProfile.Stretch[] = [];
    const legStretch: number[] = [];
    const reach = (
      from: number,
      span: number,
      axis: string,
      value: number,
      cap: number,
    ): void => {
      const range: { minimum: number; maximum: number } = speedProfile.reach(
        from,
        span,
        course.acceleration,
        course.deceleration,
      );
      const maximum: number = Math.min(range.maximum, cap);
      if (value < range.minimum || value > maximum)
        refuse(
          axis,
          value,
          `from ${from} m/s over ${span} m the support reaches only ${range.minimum} to ${maximum} m/s`,
          { kind: "range", minimum: range.minimum, maximum, unit: "m/s" },
          "give a speed the leg can reach at the course's rates, or lengthen the leg",
        );
    };
    if (marks === undefined) {
      const endSpeed: number = course.endSpeed ?? 0;
      if (startSpeed > course.cruise)
        refuse(
          "startSpeed",
          startSpeed,
          `the start speed is above the cruising speed of ${course.cruise} m/s`,
          { kind: "range", minimum: 0, maximum: course.cruise, unit: "m/s" },
          "start at or below the cruising speed",
        );
      reach(startSpeed, length, "endSpeed", endSpeed, course.cruise);
      stretches.push({
        kind: "distance",
        length,
        speed: endSpeed,
        cap: course.cruise,
      });
      rows.forEach((row: IRow, index: number): void => {
        if (row.leg.pause !== undefined)
          refuse(
            `legs[${index}].pause`,
            row.leg.pause,
            "a pause needs the leg to end at rest, which only a speed mark of 0 states",
            null,
            "give the course speed marks with 0 at this leg's end",
          );
      });
    } else {
      if (course.endSpeed !== undefined)
        refuse(
          "endSpeed",
          course.endSpeed,
          "with speed marks the last mark is the end speed",
          null,
          "drop endSpeed and set the last speed mark",
        );
      if (marks.length !== rows.length)
        refuse(
          "speeds",
          marks.length,
          `the course has ${rows.length} legs and ${marks.length} speed marks`,
          null,
          "give one speed mark per leg",
        );
      let before: number = startSpeed;
      rows.forEach((row: IRow, index: number): void => {
        const mark: number = marks[index]!;
        if (!(Number.isFinite(mark) && mark >= 0))
          refuse(
            `speeds[${index}]`,
            mark,
            "a speed mark must be finite and not negative",
          );
        const cap: number =
          before === 0 && mark === 0 ? course.cruise : Math.max(before, mark);
        reach(before, row.span, `speeds[${index}]`, mark, cap);
        legStretch.push(stretches.length);
        stretches.push({ kind: "distance", length: row.span, speed: mark, cap });
        const pause: number | undefined = row.leg.pause;
        if (pause !== undefined) {
          if (!(Number.isFinite(pause) && pause > 0))
            refuse(`legs[${index}].pause`, pause, "a pause must be positive");
          if (mark !== 0 || index === rows.length - 1)
            refuse(
              `legs[${index}].pause`,
              pause,
              mark !== 0
                ? `the leg ends at ${mark} m/s, not at rest`
                : "the last leg ends the course, so nothing follows a pause",
              null,
              "pause only where a leg ends at rest and another follows",
            );
          stretches.push({ kind: "seconds", seconds: pause, speed: 0 });
        }
        before = mark;
      });
    }
    const profile: speedProfile.IProfile = speedProfile({
      start: at,
      speed: startSpeed,
      acceleration: course.acceleration,
      deceleration: course.deceleration,
      stretches,
    });

    // The instants: the course's ends, then its speed changes, stops and turns.
    const instants: { seconds: number; label: string }[] = [
      { seconds: profile.start, label: "depart" },
    ];
    if (marks === undefined) {
      const only: speedProfile.IStretch = profile.stretches[0]!;
      if (only.level > 1e-9)
        instants.push({ seconds: only.start + only.up, label: "cruise" });
      instants.push({
        seconds: only.start + only.up + Math.max(0, only.level),
        label: "brake",
      });
    }

    // Leg by leg, so instants that fall on one second read in the order they happen: a leg's start, its turn, its stop.
    const bends: ArchetypeCourse.IBend[] = [];
    rows.forEach((row: IRow, index: number): void => {
      const own: speedProfile.IStretch | null =
        marks === undefined ? null : profile.stretches[legStretch[index]!]!;
      if (own !== null && index > 0)
        instants.push({ seconds: own.start, label: `leg${index + 1}Start` });
      if (row.leg.kind === "turn") {
        const begins: number =
          own === null ? profile.when(row.from) : own.start;
        instants.push({ seconds: begins, label: `turn${index + 1}Start` });
        instants.push({
          seconds: profile.when(row.from + row.span),
          label: `turn${index + 1}End`,
        });

        // The fastest the course lets the turn be taken is its leg's top speed, named by the mark or the rate that sets it.
        const before: number =
          marks === undefined
            ? 0
            : index === 0
              ? startSpeed
              : marks[index - 1]!;
        const mark: number = marks === undefined ? 0 : marks[index]!;
        const cruising: boolean =
          marks === undefined || (before === 0 && mark === 0);
        bends.push({
          radiusField: `course.legs[${index}].radius`,
          speedField: cruising
            ? "course.cruise"
            : mark >= before
              ? `course.speeds[${index}]`
              : index === 0
                ? "course.startSpeed"
                : `course.speeds[${index - 1}]`,
          radius: row.leg.radius,
          speed: cruising ? course.cruise : Math.max(before, mark),
          seconds: begins,
        });
      }
      if (own !== null && marks![index] === 0 && index < rows.length - 1) {
        instants.push({ seconds: own.end, label: `stop${index + 1}` });
        instants.push({
          seconds: profile.stretches[legStretch[index + 1]!]!.start,
          label: `depart${index + 1}`,
        });
      }
    });
    instants.push({ seconds: profile.end, label: "stop" });
    instants.sort(
      (p: { seconds: number }, q: { seconds: number }): number =>
        p.seconds - q.seconds,
    );

    return {
      course,
      length,
      duration: profile.end,
      peak: profile.peak,
      instants,
      bends,
      when: profile.when,
      at: (seconds: number): ArchetypeCourse.IState => {
        const { distance, speed }: speedProfile.IState = profile.at(seconds);
        let row: IRow = rows[0]!;
        for (const candidate of rows)
          if (distance >= candidate.from) row = candidate;
        const pose: IPose = advance(
          row,
          Math.min(row.span, distance - row.from),
        );
        const yaw: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          { x: 0, y: 1, z: 0 },
          pose.heading,
        );

        // Nose up by the grade's angle in the direction of travel: a turn about the support's own `+X` by the negative angle, since a positive one tips `+Z` down.
        const climb: number =
          row.rise === 0
            ? 0
            : ((Math.atan(row.rise / row.run) * 180) / Math.PI) *
              (row.reverse ? -1 : 1);
        return {
          distance,
          speed,
          curvature:
            row.leg.kind === "turn"
              ? Math.sign(row.leg.angle) / row.leg.radius
              : 0,
          reverse: row.reverse,
          placement: {
            translation: { x: pose.x, y: pose.y, z: pose.z },
            rotation:
              climb === 0
                ? yaw
                : Quaternion.normalize(
                    Quaternion.multiply(
                      yaw,
                      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -climb),
                    ),
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

  /** The leg's length along the path, metres: its run on the ground, lengthened by its grade. */
  span: number;

  /** The leg's run on the ground, metres. */
  run: number;

  /** Metres the leg gains, 0 when level. */
  rise: number;

  /** Whether the support goes backward along it. */
  reverse: boolean;

  /** The root's X where the leg starts, metres. */
  x: number;

  /** The root's height where the leg starts, metres. */
  y: number;

  /** The root's Z where the leg starts, metres. */
  z: number;

  /** The heading the support faces where the leg starts, degrees. */
  heading: number;
}

/** A place on the path and the heading faced there. */
interface IPose {
  /** X, metres. */
  x: number;

  /** Height, metres. */
  y: number;

  /** Z, metres. */
  z: number;

  /** Heading faced, degrees. */
  heading: number;
}

/**
 * Where a leg has taken the root after a distance along it.
 *
 * @param row The leg and its start.
 * @param along Distance along the leg's path, metres, from 0 to its span.
 * @returns The root's place and the heading it faces.
 */
function advance(row: IRow, along: number): IPose {
  // The ground covered and the height gained, in the grade's proportion; a level leg covers what it travels.
  const ground: number = row.rise === 0 ? along : (along * row.run) / row.span;
  const height: number =
    row.rise === 0 ? row.y : row.y + (row.rise * along) / row.span;

  // A reversed leg travels opposite to the heading it faces.
  const travel: number = row.reverse ? row.heading + 180 : row.heading;
  const h: number = (travel * Math.PI) / 180;
  if (row.leg.kind === "straight")
    return {
      x: row.x + ground * Math.sin(h),
      y: height,
      z: row.z + ground * Math.cos(h),
      heading: row.heading,
    };

  // Forward is (sin h, cos h) on (X, Z) and left is (cos h, -sin h); the centre lies a radius to the turning side of the way the root travels.
  const side: number = Math.sign(row.leg.angle);
  const swept: number = (side * ground) / row.leg.radius;
  const cx: number = row.x + side * row.leg.radius * Math.cos(h);
  const cz: number = row.z - side * row.leg.radius * Math.sin(h);
  return {
    x: cx - side * row.leg.radius * Math.cos(h + swept),
    y: height,
    z: cz + side * row.leg.radius * Math.sin(h + swept),
    heading: row.heading + (swept * 180) / Math.PI,
  };
}
