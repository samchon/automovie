import { Quaternion, AutoMovieEngineMotionTrajectory } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieSpeedProfile,
} from "@automovie/interface";

import { ArchetypeCoursePath } from "./ArchetypeCoursePath";
import type { AutoMovieArchetypeCourse } from "../AutoMovieArchetypeCourse";
import { AutoMovieArchetypeFrame } from "../AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "../AutoMovieArchetypeRefusal";
import { AutoMovieArchetypeUnits } from "../AutoMovieArchetypeUnits";

/**
 * How a course of legs is planned: its legs measured and placed end to end by
 * `ArchetypeCoursePath`, its speed marks admitted and handed to the engine's
 * speed profile, and each second's state read back from the leg that holds it.
 *
 * `AutoMovieArchetypeCourse.plan` reads the full course plan, and `AutoMovieArchetypeBoat.row`
 * also reads its travelled distance to locate catches.
 */
export namespace ArchetypeCourseLegs {
  /**
   * A course of legs made ready to sample, as `AutoMovieArchetypeCourse.plan`
   * documents it.
   *
   * @param archetype The name a refusal carries.
   * @param course The course.
   * @returns The plan and its travelled distance reader in metres at a course
   *   second.
   * @throws {AutoMovieArchetypeRefusal} As `AutoMovieArchetypeCourse.plan`
   *   states.
   */
  export function plan(
    archetype: string,
    course: AutoMovieArchetypeCourse.ICourse,
  ): {
    plan: AutoMovieArchetypeCourse.IPlan;
    distanceAt: (seconds: number) => number;
  } {
    const refuse = (
      axis: string,
      value: unknown,
      reason: string,
      feasible: AutoMovieArchetypeRefusal.Feasible | null = null,
      fix: string = "give the course a finite start, positive lengths, radii, speeds and rates, and nonzero turns",
    ): never => {
      throw new AutoMovieArchetypeRefusal({
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
    for (const [name, value] of [
      ["cruise", course.cruise],
      ["acceleration", course.acceleration],
      ["deceleration", course.deceleration],
    ] as const)
      if ((name === "cruise" || value !== undefined) && !(value! > 0))
        refuse(name, value, `${name} must be positive`);
    // A rate the course's speed changes read, refused as missing only where one is read.
    const rate = (
      name: "acceleration" | "deceleration",
      from: number,
      to: number,
    ): number =>
      course[name] ??
      refuse(
        name,
        undefined,
        `the course goes from ${from} to ${to} m/s, which needs its ${name}`,
        null,
        `give the course's ${name} in metres per second squared`,
      );

    // Each leg's run, its length along the grade, and the place and heading it starts from.
    const {
      rows,
      length,
    }: { rows: ArchetypeCoursePath.IRow[]; length: number } =
      ArchetypeCoursePath.lay(course, refuse);

    // The speed marks, each reachable from the one before it.
    const at: number = course.at ?? 0;
    const startSpeed: number = course.startSpeed ?? 0;
    for (const [name, value] of [
      ["startSpeed", startSpeed],
      ["endSpeed", course.endSpeed ?? 0],
    ] as const)
      if (!(value >= 0))
        refuse(name, value, `${name} must be finite and not negative`);
    const marks: readonly number[] | undefined = course.speeds;
    const stretches: IAutoMovieSpeedProfile.Stretch[] = [];
    const legStretch: number[] = [];
    const reach = (
      from: number,
      span: number,
      axis: string,
      value: number,
      cap: number,
    ): void => {
      // A stretch entered at its cap never speeds up and one that ends at it never slows: each bound reads its rate where it is given or used, and is the entry speed where the course neither gives nor needs it.
      const rises: boolean = from < cap;
      const falls: boolean = value < cap;
      // Braking all the way and accelerating all the way: v squared less or plus twice the rate times the span.
      const range: { minimum: number; maximum: number } = {
        minimum:
          course.deceleration !== undefined || falls
            ? Math.sqrt(
                Math.max(
                  0,
                  from * from - 2 * rate("deceleration", from, value) * span,
                ),
              )
            : from,
        maximum:
          course.acceleration !== undefined || rises
            ? Math.sqrt(
                from * from + 2 * rate("acceleration", from, value) * span,
              )
            : from,
      };
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
      rows.forEach((row: ArchetypeCoursePath.IRow, index: number): void => {
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
      rows.forEach((row: ArchetypeCoursePath.IRow, index: number): void => {
        const mark: number = marks[index]!;
        if (!(mark >= 0))
          refuse(
            `speeds[${index}]`,
            mark,
            "a speed mark must be finite and not negative",
          );
        const cap: number =
          before === 0 && mark === 0 ? course.cruise : Math.max(before, mark);
        reach(before, row.span, `speeds[${index}]`, mark, cap);
        legStretch.push(stretches.length);
        stretches.push({
          kind: "distance",
          length: row.span,
          speed: mark,
          cap,
        });
        const pause: number | undefined = row.leg.pause;
        if (pause !== undefined) {
          if (!(pause > 0))
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
    const profile: IAutoMovieSpeedProfile.IProfile = AutoMovieEngineMotionTrajectory.speedProfile({
      start: at,
      speed: startSpeed,
      ...(course.acceleration === undefined
        ? {}
        : { acceleration: course.acceleration }),
      ...(course.deceleration === undefined
        ? {}
        : { deceleration: course.deceleration }),
      stretches,
    });

    // The instants: the course's ends, then its speed changes, stops and turns.
    const instants: { seconds: number; label: string }[] = [
      { seconds: profile.start, label: "depart" },
    ];
    if (marks === undefined) {
      const only: IAutoMovieSpeedProfile.IStretch = profile.stretches[0]!;
      if (only.level > 1e-9)
        instants.push({ seconds: only.start + only.up, label: "cruise" });
      instants.push({
        seconds: only.start + only.up + Math.max(0, only.level),
        label: "brake",
      });
    }

    // Leg by leg, so instants that fall on one second read in the order they happen: a leg's start, its turn, its stop.
    const bends: AutoMovieArchetypeCourse.IBend[] = [];
    rows.forEach((row: ArchetypeCoursePath.IRow, index: number): void => {
      const own: IAutoMovieSpeedProfile.IStretch | null =
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

    // Each leg's fastest speed: the profile's phases each hold one acceleration, so speed is monotone within a phase and its greatest on a leg is at the leg's ends or at a phase's start inside it.
    const speedAt = (distance: number): number =>
      profile.at(profile.when(distance)).speed;
    const legSpans: AutoMovieArchetypeCourse.ILegSpan[] = rows.map(
      (row: ArchetypeCoursePath.IRow): AutoMovieArchetypeCourse.ILegSpan => {
        const end: number = row.from + row.span;
        let fastest: number = Math.max(speedAt(row.from), speedAt(end));
        for (const phase of profile.phases)
          if (phase.from > row.from && phase.from < end)
            fastest = Math.max(fastest, profile.at(phase.start).speed);
        return { from: row.from, span: row.span, fastest };
      },
    );
    instants.sort(
      (p: { seconds: number }, q: { seconds: number }): number =>
        p.seconds - q.seconds,
    );

    const plan: AutoMovieArchetypeCourse.IPlan = {
      kind: "plan",
      course,
      length,
      duration: profile.end,
      peak: profile.peak,
      instants,
      bends,
      legSpans,
      when: profile.when,
      at: (seconds: number): AutoMovieArchetypeCourse.IState => {
        const { distance, speed }: IAutoMovieSpeedProfile.IState =
          profile.at(seconds);
        let low: number = 0;
        let high: number = rows.length;
        while (high - low > 1) {
          const middle: number = (low + high) >>> 1;
          if (rows[middle]!.from <= distance) low = middle;
          else high = middle;
        }
        const row: ArchetypeCoursePath.IRow = rows[low]!;
        const pose: ArchetypeCoursePath.IPose = ArchetypeCoursePath.advance(
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
            : (Math.atan(row.rise / row.run) / AutoMovieArchetypeUnits.DEGREE) *
              (row.reverse ? -1 : 1);
        return {
          distance,
          speed,
          progress:
            row.progress +
            (row.reverse ? -1 : 1) * Math.min(row.span, distance - row.from),
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
            scale: { ...AutoMovieArchetypeFrame.UNIT },
          },
        };
      },
    };
    return {
      plan,
      distanceAt: (seconds: number): number => profile.at(seconds).distance,
    };
  }
}
