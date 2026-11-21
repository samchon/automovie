import { Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { ArchetypeCourse } from "./ArchetypeCourse";
import { ArchetypeRefusal } from "./ArchetypeRefusal";
import { ArchetypeUnits } from "./ArchetypeUnits";

/**
 * Timed paths for mounted manoeuvres, as samples `ArchetypeCourse.timed` plans: a circular arc at an even rate, a line wheeling about a centre, a station kept on a moving carrier, a place kept behind a leader on its own path, and the windows in which a body faces a target.
 *
 * Arcs and wheels are admitted against the speed range of the gait they are ridden at, such as `QuadrupedGait.range` gives, and refused with the radii that range allows. Headings are degrees about `+Y` from `+Z`, positive toward `+X`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each path, the admission and the heading convention.
 * @evidence contracts/development/design.md#principled-representation World metres, film seconds, degrees and metres per second; paths are course samples, windows intervals of film seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The paths the cavalry, escort, herd and skirmish stagings plan (#3957, #3958, #3959, #3965); the timed plan and its rides are `ArchetypeCourse`'s and `ArchetypeRide`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The speed range is the caller's from its gait source, never a constant here.
 */
export namespace ArchetypeManoeuvre {
  /**
   * A gait's admitted speeds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and the source.
   * @evidence contracts/development/design.md#principled-representation Two speeds in metres per second, the least not above the greatest.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The shape `QuadrupedGait.range` returns, read by `arc` and `wheel`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISpeedRange {
    /** The slowest admitted speed, metres per second. */
    minimum: number;

    /** The fastest admitted speed, metres per second. */
    maximum: number;
  }

  /**
   * A circular arc ridden at an even rate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and meaning.
   * @evidence contracts/development/design.md#principled-representation A centre in metres, a radius in metres, a start bearing and a signed sweep in degrees, and a window in film seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `arc`; a wheel's files and a loop are arcs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IArc {
    /** The arc's centre on the floor, world metres. */
    centre: IAutoMovieVector3;

    /** Its radius, metres, positive. */
    radius: number;

    /** The bearing of the start from the centre, degrees about `+Y` from `+Z`. */
    bearing: number;

    /** The signed angle swept, degrees; positive turns the bearing toward `+X`. */
    sweep: number;

    /** The film second the arc begins. */
    start: number;

    /** The film second it ends, after `start`. */
    end: number;
  }

  /**
   * A line wheeling about a centre: its files on one ray from the centre, each sweeping the same angle in the same time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and meaning.
   * @evidence contracts/development/design.md#principled-representation The centre, the ray's bearing, the inner file's radius and the file spacing in metres, the count, a signed sweep in degrees and a window in film seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `wheel` (#3957).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IWheel {
    /** The wheel's centre on the floor, world metres. */
    centre: IAutoMovieVector3;

    /** The bearing of the files' ray from the centre, degrees. */
    bearing: number;

    /** The radius of the file nearest the centre, the pivot flank, metres, positive. */
    inner: number;

    /** The distance from file to file along the ray, metres, positive. */
    spacing: number;

    /** The number of files, at least one. */
    files: number;

    /** The signed angle the line wheels, degrees. */
    sweep: number;

    /** The film second the wheel begins. */
    start: number;

    /** The film second it ends. */
    end: number;
  }

  /**
   * An interval of film seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit.
   * @evidence contracts/development/design.md#principled-representation Two film seconds, the first not after the second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `facing`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IWindow {
    /** The first second. */
    from: number;

    /** The last second. */
    to: number;
  }

  /**
   * An arc's samples, every `step` seconds and at its end, admitted against a gait's speeds.
   *
   * @param archetype The name a refusal carries.
   * @param arc The arc.
   * @param range The gait's admitted speeds.
   * @param step Seconds between samples, positive.
   * @returns The samples in time order.
   * @throws {ArchetypeRefusal} On `radius` when the even speed, the swept length over the time, falls outside the range, with the radii that range allows over the same sweep and time; on `end` when the arc does not run forward.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sampling and both refusals.
   * @evidence contracts/development/implementation.md#principled-implementation An even angular rate gives the speed radius times rate, so the admitted radii are the range's speeds over the rate, in closed form.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, then one point per sample.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A radius outside the range is refused, never moved.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the samples.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function arc(
    archetype: string,
    arc: IArc,
    range: ISpeedRange,
    step: number,
  ): ArchetypeCourse.ISample[] {
    admitSpeed(archetype, "radius", arc.radius, rate(archetype, arc), range, 0);
    return sampled(
      arc.start,
      arc.end,
      step,
      (u: number): IAutoMovieVector3 =>
        around(arc.centre, arc.radius, arc.bearing + arc.sweep * u),
    );
  }

  /**
   * A wheel's files' samples, the pivot flank's first.
   *
   * @param archetype The name a refusal carries.
   * @param wheel The wheel.
   * @param range The gait's admitted speeds.
   * @param step Seconds between samples, positive.
   * @returns Each file's samples.
   * @throws {ArchetypeRefusal} On `inner` when a file's speed falls outside the range, with the inner radii for which every file stays inside it; on `files` for a count that is not a positive whole number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Each file sweeps the same angle in the same time, so its speed is its radius times the common rate: the outer files ride faster in proportion to their radius, the drill rule of a wheel. The inner radius admits every file between the range's least speed over the rate and its greatest over the rate less the line's width.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the line, then one `arc` per file.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A line the gait cannot wheel is refused, never respaced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in files times samples.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function wheel(
    archetype: string,
    wheel: IWheel,
    range: ISpeedRange,
    step: number,
  ): ArchetypeCourse.ISample[][] {
    if (!(Number.isInteger(wheel.files) && wheel.files >= 1))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "files",
        value: wheel.files,
        feasible: { kind: "range", minimum: 1, maximum: null, unit: "" },
        reason: `a line of ${wheel.files} files does not wheel`,
        fix: "give a whole number of files",
      });
    const width: number = (wheel.files - 1) * wheel.spacing;
    const omega: number = rate(archetype, {
      ...wheel,
      radius: wheel.inner,
    });
    admitSpeed(archetype, "inner", wheel.inner, omega, range, width);
    return Array.from(
      { length: wheel.files },
      (_: unknown, file: number): ArchetypeCourse.ISample[] =>
        arc(
          archetype,
          { ...wheel, radius: wheel.inner + file * wheel.spacing },
          range,
          step,
        ),
    );
  }

  /**
   * The samples of a station kept on a moving carrier: a point fixed in the carrier's frame, such as an escort beside a carriage's wheel.
   *
   * @param plan The carrier's course.
   * @param offset The station in the carrier's frame, metres: `+X` its left, `+Z` ahead.
   * @param from The first film second.
   * @param to The last film second, after `from`.
   * @param step Seconds between samples, positive.
   * @returns The samples in time order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and the sampling.
   * @evidence contracts/development/implementation.md#principled-implementation The carrier's placement at each second carries the offset, the same rigid transform its own parts ride.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One placement per sample.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One plan read per sample.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function station(
    plan: ArchetypeCourse.IPlan,
    offset: IAutoMovieVector3,
    from: number,
    to: number,
    step: number,
  ): ArchetypeCourse.ISample[] {
    return sampled(from, to, step, (u: number): IAutoMovieVector3 => {
      const state: ArchetypeCourse.IState = plan.at(from + (to - from) * u);
      const turned: IAutoMovieVector3 = Quaternion.rotateVector(
        state.placement.rotation,
        offset,
      );
      const root: IAutoMovieVector3 = state.placement.translation;
      return { x: root.x + turned.x, y: root.y, z: root.z + turned.z };
    });
  }

  /**
   * The samples of a place kept a fixed distance behind a leader along the leader's own path, as a string of animals tied head to tail follows its lead.
   *
   * @param plan The leader's course.
   * @param gap The distance behind along the path, metres, at least 0.
   * @param from The first film second.
   * @param to The last film second, after `from`.
   * @param step Seconds between samples, positive.
   * @returns The samples in time order; before the leader has gone `gap` the follower stands at the path's start.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule and its start.
   * @evidence contracts/development/implementation.md#principled-implementation The leader's distance less the gap, read back to the second the leader passed it, so the follower treads the leader's line.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One distance and one inverse per sample.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms The plan's inverse per sample.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function follow(
    plan: ArchetypeCourse.IPlan,
    gap: number,
    from: number,
    to: number,
    step: number,
  ): ArchetypeCourse.ISample[] {
    return sampled(from, to, step, (u: number): IAutoMovieVector3 => {
      const distance: number = plan.at(from + (to - from) * u).distance - gap;
      return plan.at(plan.when(Math.max(0, distance))).placement.translation;
    });
  }

  /**
   * The windows in which a body on a course faces a target within a half angle of an aim direction, such as a rider loosing to the left.
   *
   * @param plan The body's course.
   * @param target The target on the floor, world metres.
   * @param aim The aim's direction from the body's heading, degrees.
   * @param half The half angle of the window, degrees, positive.
   * @param from The first film second.
   * @param to The last film second, after `from`.
   * @param step Seconds between readings, positive.
   * @returns The windows in time order, their ends placed by bisection between readings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the window, its unit and its ends.
   * @evidence contracts/development/implementation.md#principled-implementation The angle between the aim and the bearing to the target, folded into 0 to 180 degrees, read every step; bisection between a reading inside and one outside places each end. A window shorter than a step between two outside readings is not found.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read, then scan runs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in readings plus a fixed bisection per end.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the readings until it returns.
   */
  export function facing(
    plan: ArchetypeCourse.IPlan,
    target: IAutoMovieVector3,
    aim: number,
    half: number,
    from: number,
    to: number,
    step: number,
  ): IWindow[] {
    const inside: (seconds: number) => boolean = (seconds: number): boolean => {
      const state: ArchetypeCourse.IState = plan.at(seconds);
      const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
        state.placement.rotation,
        { x: 0, y: 0, z: 1 },
      );
      const root: IAutoMovieVector3 = state.placement.translation;
      const heading: number =
        Math.atan2(ahead.x, ahead.z) / ArchetypeUnits.DEGREE + aim;
      const bearing: number =
        Math.atan2(target.x - root.x, target.z - root.z) /
        ArchetypeUnits.DEGREE;
      return (
        Math.abs(((((bearing - heading) % 360) + 540) % 360) - 180) <= half
      );
    };
    const times: number[] = [];
    for (let k: number = 0; from + k * step < to; ++k)
      times.push(from + k * step);
    times.push(to);
    const readings: boolean[] = times.map(inside);
    const windows: IWindow[] = [];
    for (let k: number = 0; k < times.length; ++k) {
      if (!readings[k]) continue;
      let end: number = k;
      while (end + 1 < times.length && readings[end + 1]) ++end;
      windows.push({
        from: k === 0 ? times[0]! : edge(inside, times[k - 1]!, times[k]!),
        to:
          end === times.length - 1
            ? times[end]!
            : edge(inside, times[end + 1]!, times[end]!),
      });
      k = end;
    }
    return windows;
  }
}

/** Halvings that place a window's end: forty shrink a one-step bracket below a picosecond. */
const REFINE: number = 40;

/** An arc's angular rate, radians per second, refusing a window that does not run forward. */
function rate(archetype: string, arc: ArchetypeManoeuvre.IArc): number {
  if (!(arc.end > arc.start && arc.radius > 0))
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "end",
      value: arc.end,
      feasible: { kind: "range", minimum: arc.start, maximum: null, unit: "s" },
      reason: `an arc of radius ${arc.radius} m from ${arc.start} s to ${arc.end} s does not run forward`,
      fix: "give a positive radius and an end after the start",
    });
  return (Math.abs(arc.sweep) * ArchetypeUnits.DEGREE) / (arc.end - arc.start);
}

/** Refuse a radius whose even speed, or that of a line `width` beyond it, leaves the range; name the radii it allows. */
function admitSpeed(
  archetype: string,
  axis: string,
  radius: number,
  omega: number,
  range: ArchetypeManoeuvre.ISpeedRange,
  width: number,
): void {
  const least: number = range.minimum / omega;
  const most: number = range.maximum / omega - width;
  if (radius >= least && radius <= most) return;
  throw new ArchetypeRefusal({
    kind: "parameter",
    archetype,
    axis,
    value: radius,
    feasible: { kind: "range", minimum: least, maximum: most, unit: "m" },
    reason: `at ${omega / ArchetypeUnits.DEGREE} degrees a second a radius of ${radius} m${width > 0 ? ` and a line ${width} m wide` : ""} leaves the gait's ${range.minimum} to ${range.maximum} m/s`,
    fix: "change the radius, the sweep or its time so every file keeps the gait's speeds",
  });
}

/** A floor point at a bearing and distance from a centre. */
function around(
  centre: IAutoMovieVector3,
  radius: number,
  bearing: number,
): IAutoMovieVector3 {
  const b: number = bearing * ArchetypeUnits.DEGREE;
  return {
    x: centre.x + radius * Math.sin(b),
    y: centre.y,
    z: centre.z + radius * Math.cos(b),
  };
}

/** Samples every `step` seconds from `from` and at `to`, each placed by its fraction of the window. */
function sampled(
  from: number,
  to: number,
  step: number,
  at: (u: number) => IAutoMovieVector3,
): ArchetypeCourse.ISample[] {
  const samples: ArchetypeCourse.ISample[] = [];
  const push: (seconds: number) => void = (seconds: number): void => {
    const point: IAutoMovieVector3 = at((seconds - from) / (to - from));
    samples.push({ seconds, x: point.x, y: point.y, z: point.z });
  };
  for (let k: number = 0; from + k * step < to; ++k) push(from + k * step);
  push(to);
  return samples;
}

/** The inside end of a bracket between an outside second and an inside one, by bisection. */
function edge(
  inside: (seconds: number) => boolean,
  outside: number,
  within: number,
): number {
  let out: number = outside;
  let ins: number = within;
  for (let k: number = 0; k < REFINE; ++k) {
    const middle: number = (out + ins) / 2;
    if (inside(middle)) ins = middle;
    else out = middle;
  }
  return ins;
}
