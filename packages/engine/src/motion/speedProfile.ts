import type { IAutoMovieSpeedProfile } from "@automovie/interface";
/**
 * Progress along a path in time from speed marks: how far a moving thing has gone and how fast it goes at any film second, with its acceleration and braking bounded, in closed form.
 *
 * The path is cut into stretches, each ending at a speed mark. A distance stretch covers a stated length and ends at its mark: from the speed it enters at, the mover accelerates at the profile's acceleration toward the stretch's cap, holds it, and brakes at the profile's deceleration so as to reach the mark exactly at the stretch's end; a stretch too short to reach its cap peaks where accelerating and braking meet. A seconds stretch lasts a stated time and changes speed at a constant rate from its entry to its mark, the one profile two speeds and a duration fix. The mover may start already moving and end still moving, and it holds at the path's start until the profile's first second. A distance stretch entered and left at its cap holds that speed throughout and reads neither rate, so a path run at one speed needs none; a stretch that changes speed needs the rates it uses. Every phase therefore has a constant acceleration, so distance is quadratic in time and time a square root of distance.
 *
 * A braking phase is evaluated back from its end, so a distance stretch ends at its stretch's length and its mark exactly, with no rounding carried in from the phases before it.
 *
 * @param props The start, the rates and the stretches.
 * @returns The profile.
 * @throws {Error} When the start, a given rate, a speed, a length, a duration or a cap is not finite or not in its range, a stretch that changes speed lacks a rate it needs, a distance stretch's mark lies outside what its length can reach from its entry speed (`speedProfile.reach`), its cap is below its entry or its mark, or a seconds stretch changes speed faster than the rates allow: a caller's defect, since a caller admits its own input with its own refusals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both kinds of stretch, the cap and the peak, flying starts and ends, the start second, the end-anchored braking and every failure.
 * @evidence contracts/development/implementation.md#principled-implementation Piecewise-constant acceleration integrated in closed form: s = s0 + v0 t + a t squared over 2 and v = v0 + a t. A distance stretch is the trapezoidal profile of motion planning with bounded acceleration and boundary speeds: its peak is the speed at which an accelerating run from the entry and a braking run to the mark together cover the length, the square root of (2 L a b + b v0 squared + a v1 squared) over (a + b), lowered to the cap. Inverting time from distance takes the root that is stable for its sign: the square root of 2 s over a from rest, and 2 s over (v0 + the square root of (v0 squared + 2 a s)) otherwise, which avoids cancellation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the input, lay each stretch's phases end to end, then two samplers that find the phase and evaluate it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unreachable marks and rates are thrown, never clamped; a second or distance outside the profile holds the nearer end.
 * @evidence contracts/development/implementation.md#efficient-algorithms Laying is linear in the stretches; a sample scans at most three phases per stretch, a handful for any real path.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One profile serves every sample of its path.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The profile holds one record per phase and per stretch for as long as its caller keeps it.
 */
export function speedProfile(
  props: IAutoMovieSpeedProfile.IProps,
): IAutoMovieSpeedProfile.IProfile {
  const fail = (what: string): never => {
    throw new Error(`speedProfile: ${what}`);
  };
  if (!Number.isFinite(props.start)) fail(`start ${props.start} is not finite`);
  for (const [name, rate] of [
    ["acceleration", props.acceleration],
    ["deceleration", props.deceleration],
  ] as const)
    if (rate !== undefined && !(Number.isFinite(rate) && rate > 0))
      fail(`${name} ${rate} is not positive`);
  // A rate is read only by a stretch that changes speed; one that needs a missing rate fails there.
  const rate = (name: "acceleration" | "deceleration", k: number): number =>
    props[name] ??
    fail(`stretch ${k} changes speed, which needs the profile's ${name}`);
  if (!(Number.isFinite(props.speed) && props.speed >= 0))
    fail(`the start speed ${props.speed} is negative or not finite`);

  const phases: IAutoMovieSpeedProfile.IPhase[] = [];
  const stretches: IAutoMovieSpeedProfile.IStretch[] = [];
  let t: number = props.start;
  let s: number = 0;
  let v: number = props.speed;
  props.stretches.forEach((stretch: IAutoMovieSpeedProfile.Stretch, k: number): void => {
    const end: number = stretch.speed;
    if (!(Number.isFinite(end) && end >= 0))
      fail(`stretch ${k}'s speed ${end} is negative or not finite`);
    if (stretch.kind === "seconds") {
      // One constant rate from the entry speed to the mark over the stated time.
      const seconds: number = stretch.seconds;
      if (!(Number.isFinite(seconds) && seconds > 0))
        fail(`stretch ${k}'s duration ${seconds} is not positive`);
      const change: number = (end - v) / seconds;
      if (change > 0 && change > rate("acceleration", k))
        fail(
          `stretch ${k} speeds up at ${change} m/s squared, past the acceleration ${props.acceleration}`,
        );
      if (change < 0 && -change > rate("deceleration", k))
        fail(
          `stretch ${k} slows at ${-change} m/s squared, past the deceleration ${props.deceleration}`,
        );
      const to: number = s + ((v + end) * seconds) / 2;
      phases.push({
        start: t,
        end: t + seconds,
        from: s,
        to,
        speed: v,
        acceleration: change,
        anchor: "start",
        stretch: k,
      });
      stretches.push({
        start: t,
        end: t + seconds,
        from: s,
        to,
        peak: Math.max(v, end),
        up: change > 0 ? seconds : 0,
        level: change === 0 ? seconds : 0,
        down: change < 0 ? seconds : 0,
      });
      t += seconds;
      s = to;
      v = end;
      return;
    }

    // A distance stretch: accelerate toward the cap, hold, brake onto the mark.
    const length: number = stretch.length;
    const cap: number = stretch.cap;
    if (!(Number.isFinite(length) && length > 0))
      fail(`stretch ${k}'s length ${length} is not positive`);
    if (!(Number.isFinite(cap) && cap > 0 && cap >= v && cap >= end))
      fail(
        `stretch ${k}'s cap ${cap} is not positive or lies below its entry ${v} or its mark ${end}`,
      );
    // A stretch entered at its cap never speeds up and one that ends at it never slows; each reads only the rate it uses, and its peak is its cap.
    const rises: boolean = v < cap;
    const falls: boolean = end < cap;
    // A rate the stretch does not use still labels its empty phase when given, so a profile with both rates lays as it always has.
    const a: number = rises
      ? rate("acceleration", k)
      : (props.acceleration ?? 0);
    const b: number = falls
      ? rate("deceleration", k)
      : (props.deceleration ?? 0);
    const highest: number = rises ? Math.sqrt(v * v + 2 * a * length) : v;
    const lowest: number = falls
      ? Math.sqrt(Math.max(0, v * v - 2 * b * length))
      : v;
    if (end < lowest || end > highest)
      fail(
        `stretch ${k}'s mark ${end} lies outside the ${lowest} to ${highest} m/s its length reaches`,
      );
    const peak: number =
      rises && falls
        ? Math.min(
            cap,
            Math.sqrt(
              (2 * length * a * b + b * v * v + a * end * end) / (a + b),
            ),
          )
        : cap;
    const up: number = rises ? (peak - v) / a : 0;
    const down: number = falls ? (peak - end) / b : 0;
    const upDistance: number = ((v + peak) * up) / 2;
    const downDistance: number = ((peak + end) * down) / 2;
    const level: number = (length - upDistance - downDistance) / peak;
    const finish: number = s + length;
    const cruising: number = t + up;
    const braking: number = cruising + level;
    phases.push(
      {
        start: t,
        end: cruising,
        from: s,
        to: s + upDistance,
        speed: v,
        acceleration: a,
        anchor: "start",
        stretch: k,
      },
      {
        start: cruising,
        end: braking,
        from: s + upDistance,
        to: finish - downDistance,
        speed: peak,
        acceleration: 0,
        anchor: "start",
        stretch: k,
      },
      {
        start: braking,
        end: braking + down,
        from: finish - downDistance,
        to: finish,
        speed: end,
        acceleration: -b,
        anchor: "end",
        stretch: k,
      },
    );
    stretches.push({
      start: t,
      end: braking + down,
      from: s,
      to: finish,
      peak,
      up,
      level,
      down,
    });
    t = braking + down;
    s = finish;
    v = end;
  });

  const length: number = s;
  const first: number = props.start;
  const last: number = t;
  const at = (seconds: number): IAutoMovieSpeedProfile.IState => {
    // Held at the start before the first second, then moving at the start speed from it.
    if (seconds < first) return { distance: 0, speed: 0, acceleration: 0 };
    if (phases.length === 0 || seconds === first)
      return { distance: 0, speed: props.speed, acceleration: 0 };
    const clamped: number = Math.min(last, seconds);
    let phase: IAutoMovieSpeedProfile.IPhase = phases[phases.length - 1]!;
    for (const candidate of phases)
      if (clamped <= candidate.end) {
        phase = candidate;
        break;
      }
    if (phase.anchor === "end") {
      // Braking, read back from where the phase ends: its speed there is `speed`, its rate minus `acceleration`.
      const left: number = phase.end - clamped;
      const rate: number = -phase.acceleration;
      return {
        distance: phase.to - (phase.speed * left + (rate * left * left) / 2),
        speed: phase.speed + rate * left,
        acceleration: seconds > last ? 0 : phase.acceleration,
      };
    }
    const into: number = clamped - phase.start;
    return {
      distance:
        phase.from +
        phase.speed * into +
        (phase.acceleration * into * into) / 2,
      speed: phase.speed + phase.acceleration * into,
      acceleration: seconds > last ? 0 : phase.acceleration,
    };
  };
  const when = (distance: number): number => {
    const d: number = Math.max(0, Math.min(length, distance));
    const phase: IAutoMovieSpeedProfile.IPhase | undefined = phases.find(
      (p: IAutoMovieSpeedProfile.IPhase): boolean => d <= p.to,
    );
    if (phase === undefined) return phases.length === 0 ? first : last;
    if (phase.to === phase.from) return phase.start;
    if (phase.anchor === "end") {
      const left: number = phase.to - d;
      const rate: number = -phase.acceleration;
      return (
        phase.end -
        (phase.speed === 0
          ? Math.sqrt((2 * left) / rate)
          : (2 * left) /
            (phase.speed +
              Math.sqrt(phase.speed * phase.speed + 2 * rate * left)))
      );
    }
    const into: number = d - phase.from;
    if (phase.acceleration === 0) return phase.start + into / phase.speed;
    if (phase.speed === 0)
      return phase.start + Math.sqrt((2 * into) / phase.acceleration);
    return (
      phase.start +
      (2 * into) /
        (phase.speed +
          Math.sqrt(
            Math.max(
              0,
              phase.speed * phase.speed + 2 * phase.acceleration * into,
            ),
          ))
    );
  };
  return {
    phases,
    stretches,
    start: first,
    end: last,
    length,
    peak: stretches.reduce(
      (most: number, stretch: IAutoMovieSpeedProfile.IStretch): number =>
        Math.max(most, stretch.peak),
      props.speed,
    ),
    at,
    when,
  };
}

/**
 * Companion types and the reach rule of {@link speedProfile}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each type and member states its unit and meaning.
 * @evidence contracts/development/design.md#principled-representation Distances in metres along the path, speeds in metres per second, rates in metres per second squared and times in film seconds; a stretch is a discriminated union of its two ways of ending, and a phase records its anchor so a braking phase ends exactly where it must.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the engine as a universal motion primitive with no vehicle vocabulary; read by the archetypes' course and, per #3503's P13, by a formation's path frame.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A stretch's kind discriminates a length with a cap from a duration, so neither carries the other's fields.
 */
export namespace speedProfile {

  /**
   * The speeds a stretch of a length can end at from an entry speed under the rates: from braking all the way to accelerating all the way.
   *
   * @param speed The entry speed, metres per second.
   * @param length The stretch's length, metres.
   * @param acceleration The acceleration, metres per second squared.
   * @param deceleration The braking, metres per second squared.
   * @returns The least and greatest end speed, metres per second; the least is 0 when the stretch is long enough to stop in.
   *
   */
  export function reach(
    speed: number,
    length: number,
    acceleration: number,
    deceleration: number,
  ): IAutoMovieSpeedProfile.IReachResult {
    return {
      minimum: Math.sqrt(
        Math.max(0, speed * speed - 2 * deceleration * length),
      ),
      maximum: Math.sqrt(speed * speed + 2 * acceleration * length),
    };
  }
}
