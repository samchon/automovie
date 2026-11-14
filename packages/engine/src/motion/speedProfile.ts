/**
 * Progress along a path in time from speed marks: how far a moving thing has gone and how fast it goes at any film second, with its acceleration and braking bounded, in closed form.
 *
 * The path is cut into stretches, each ending at a speed mark. A distance stretch covers a stated length and ends at its mark: from the speed it enters at, the mover accelerates at the profile's acceleration toward the stretch's cap, holds it, and brakes at the profile's deceleration so as to reach the mark exactly at the stretch's end; a stretch too short to reach its cap peaks where accelerating and braking meet. A seconds stretch lasts a stated time and changes speed at a constant rate from its entry to its mark, the one profile two speeds and a duration fix. The mover may start already moving and end still moving, and it holds at the path's start until the profile's first second. Every phase therefore has a constant acceleration, so distance is quadratic in time and time a square root of distance.
 *
 * A braking phase is evaluated back from its end, so a distance stretch ends at its stretch's length and its mark exactly, with no rounding carried in from the phases before it.
 *
 * @param props The start, the rates and the stretches.
 * @returns The profile.
 * @throws {Error} When the start, a rate, a speed, a length, a duration or a cap is not finite or not in its range, a distance stretch's mark lies outside what its length can reach from its entry speed (`speedProfile.reach`), its cap is below its entry or its mark, or a seconds stretch changes speed faster than the rates allow: a caller's defect, since a caller admits its own input with its own refusals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both kinds of stretch, the cap and the peak, flying starts and ends, the start second, the end-anchored braking and every failure.
 * @evidence contracts/development/implementation.md#principled-implementation Piecewise-constant acceleration integrated in closed form: s = s0 + v0 t + a t squared over 2 and v = v0 + a t. A distance stretch is the trapezoidal profile of motion planning with bounded acceleration and boundary speeds: its peak is the speed at which an accelerating run from the entry and a braking run to the mark together cover the length, the square root of (2 L a b + b v0 squared + a v1 squared) over (a + b), lowered to the cap. Inverting time from distance takes the root that is stable for its sign: the square root of 2 s over a from rest, and 2 s over (v0 + the square root of (v0 squared + 2 a s)) otherwise, which avoids cancellation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the input, lay each stretch's phases end to end, then two samplers that find the phase and evaluate it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unreachable marks and rates are thrown, never clamped; a second or distance outside the profile holds the nearer end.
 * @evidence contracts/development/implementation.md#efficient-algorithms Laying is linear in the stretches; a sample scans at most three phases per stretch, a handful for any real path.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One profile serves every sample of its path.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The profile holds one record per phase and per stretch for as long as its caller keeps it.
 */
export function speedProfile(props: speedProfile.IProps): speedProfile.IProfile {
  const a: number = props.acceleration;
  const b: number = props.deceleration;
  const fail = (what: string): never => {
    throw new Error(`speedProfile: ${what}`);
  };
  if (!Number.isFinite(props.start)) fail(`start ${props.start} is not finite`);
  if (!(Number.isFinite(a) && a > 0)) fail(`acceleration ${a} is not positive`);
  if (!(Number.isFinite(b) && b > 0)) fail(`deceleration ${b} is not positive`);
  if (!(Number.isFinite(props.speed) && props.speed >= 0))
    fail(`the start speed ${props.speed} is negative or not finite`);

  const phases: speedProfile.IPhase[] = [];
  const stretches: speedProfile.IStretch[] = [];
  let t: number = props.start;
  let s: number = 0;
  let v: number = props.speed;
  props.stretches.forEach((stretch: speedProfile.Stretch, k: number): void => {
    const end: number = stretch.speed;
    if (!(Number.isFinite(end) && end >= 0))
      fail(`stretch ${k}'s speed ${end} is negative or not finite`);
    if (stretch.kind === "seconds") {
      // One constant rate from the entry speed to the mark over the stated time.
      const seconds: number = stretch.seconds;
      if (!(Number.isFinite(seconds) && seconds > 0))
        fail(`stretch ${k}'s duration ${seconds} is not positive`);
      const rate: number = (end - v) / seconds;
      if (rate > a || rate < -b)
        fail(
          `stretch ${k} changes speed at ${rate} m/s squared, outside -${b} to ${a}`,
        );
      const to: number = s + ((v + end) * seconds) / 2;
      phases.push({
        start: t,
        end: t + seconds,
        from: s,
        to,
        speed: v,
        acceleration: rate,
        anchor: "start",
        stretch: k,
      });
      stretches.push({
        start: t,
        end: t + seconds,
        from: s,
        to,
        peak: Math.max(v, end),
        up: rate > 0 ? seconds : 0,
        level: rate === 0 ? seconds : 0,
        down: rate < 0 ? seconds : 0,
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
    const range: { minimum: number; maximum: number } = speedProfile.reach(
      v,
      length,
      a,
      b,
    );
    if (end < range.minimum || end > range.maximum)
      fail(
        `stretch ${k}'s mark ${end} lies outside the ${range.minimum} to ${range.maximum} m/s its length reaches`,
      );
    const peak: number = Math.min(
      cap,
      Math.sqrt((2 * length * a * b + b * v * v + a * end * end) / (a + b)),
    );
    const up: number = (peak - v) / a;
    const down: number = (peak - end) / b;
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
  const at = (seconds: number): speedProfile.IState => {
    // Held at the start before the first second, then moving at the start speed from it.
    if (seconds < first) return { distance: 0, speed: 0, acceleration: 0 };
    if (phases.length === 0 || seconds === first)
      return { distance: 0, speed: props.speed, acceleration: 0 };
    const clamped: number = Math.min(last, seconds);
    let phase: speedProfile.IPhase = phases[phases.length - 1]!;
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
    const phase: speedProfile.IPhase | undefined = phases.find(
      (p: speedProfile.IPhase): boolean => d <= p.to,
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
            (phase.speed + Math.sqrt(phase.speed * phase.speed + 2 * rate * left)))
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
      (most: number, stretch: speedProfile.IStretch): number =>
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
   * What a profile is laid from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and range.
   * @evidence contracts/development/design.md#principled-representation A start second, a start speed, two positive rates and the stretches in order; ranges are admitted by `speedProfile`, which throws.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; written by each caller and read once.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IProps {
    /** The film second the motion begins; the mover holds at the path's start before it. */
    start: number;

    /** The speed at the start, metres per second, at least 0: above 0 for a flying start. */
    speed: number;

    /** The acceleration, metres per second squared, positive. */
    acceleration: number;

    /** The braking, metres per second squared, positive. */
    deceleration: number;

    /** The stretches in order along the path. */
    stretches: readonly Stretch[];
  }

  /**
   * One stretch of the path, ending at a speed mark.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its two forms.
   * @evidence contracts/development/design.md#principled-representation A mark reached at a distance or after a duration, discriminated by `kind`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; one entry of `IProps.stretches`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A union, not one record with an optional length or duration.
   */
  export type Stretch = IDistance | ISeconds;

  /**
   * A stretch that ends at its mark after a stated length.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and range.
   * @evidence contracts/development/design.md#principled-representation A length in metres, an end speed and a top speed in metres per second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the stretch a course's leg gives.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IDistance {
    /** The discriminator. */
    kind: "distance";

    /** Its length along the path, metres, positive. */
    length: number;

    /** The speed at its end, metres per second, at least 0: 0 for a stop. */
    speed: number;

    /** The fastest the mover goes within it, metres per second, positive and at least its entry and end speeds. */
    cap: number;
  }

  /**
   * A stretch that ends at its mark after a stated time.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and range.
   * @evidence contracts/development/design.md#principled-representation A duration in seconds and an end speed in metres per second; the distance follows.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the stretch a mark at a given second gives, and a pause at rest.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISeconds {
    /** The discriminator. */
    kind: "seconds";

    /** Its duration, seconds, positive. */
    seconds: number;

    /** The speed at its end, metres per second, at least 0. */
    speed: number;
  }

  /**
   * One phase of constant acceleration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and the anchor's meaning.
   * @evidence contracts/development/design.md#principled-representation An interval of film seconds and of distance with the speed at its anchor and a constant acceleration.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; laid by `speedProfile` and read by its samplers and by a caller that names a phase's start.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPhase {
    /** Its first film second. */
    start: number;

    /** Its last film second. */
    end: number;

    /** The distance at its start, metres. */
    from: number;

    /** The distance at its end, metres. */
    to: number;

    /** The speed at its anchor, metres per second: at its start, or at its end for a phase anchored there. */
    speed: number;

    /** Its constant acceleration, metres per second squared, negative while braking. */
    acceleration: number;

    /** Where the phase is evaluated from: its start, or its end for a braking phase that must end exactly on its mark. */
    anchor: "start" | "end";

    /** The index of the stretch it belongs to. */
    stretch: number;
  }

  /**
   * One stretch as laid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit.
   * @evidence contracts/development/design.md#principled-representation The stretch's interval of seconds and distance, its top speed and the time it spends accelerating, holding and braking.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; read by a caller naming a stretch's instants, such as a course's `cruise` and `brake`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStretch {
    /** Its first film second. */
    start: number;

    /** Its last film second. */
    end: number;

    /** The distance at its start, metres. */
    from: number;

    /** The distance at its end, metres. */
    to: number;

    /** Its top speed, metres per second. */
    peak: number;

    /** Seconds spent accelerating. */
    up: number;

    /** Seconds spent at the top speed; a distance stretch that only peaks gives 0 or a rounding residue below it. */
    level: number;

    /** Seconds spent braking. */
    down: number;
  }

  /**
   * Where the mover is at one second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit.
   * @evidence contracts/development/design.md#principled-representation Distance, speed and acceleration at one instant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `IProfile.at`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IState {
    /** Distance along the path, metres. */
    distance: number;

    /** Speed, metres per second. */
    speed: number;

    /** Acceleration, metres per second squared; 0 outside the profile. */
    acceleration: number;
  }

  /**
   * A laid profile.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and what the samplers return outside the profile.
   * @evidence contracts/development/design.md#principled-representation The phases and stretches as plain data with the profile's interval, its length and top speed, and two pure samplers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `speedProfile`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IProfile {
    /** The phases in time order. */
    phases: readonly IPhase[];

    /** The stretches in order. */
    stretches: readonly IStretch[];

    /** The film second the motion begins. */
    start: number;

    /** The film second the last stretch ends. */
    end: number;

    /** The path's length, metres. */
    length: number;

    /** The greatest speed reached, metres per second. */
    peak: number;

    /**
     * The state at a film second: at rest at the path's start before `start`, at the start speed at `start`, and the end state after `end`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and the held ends.
     * @evidence contracts/development/implementation.md#principled-implementation The phase holding the second, integrated in closed form from its anchor.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the phase, evaluate it.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Outside the profile the end state holds, never extrapolated.
     * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the phases.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the phases laid once.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the profile's closure.
     */
    at: (seconds: number) => IState;

    /**
     * The film second a distance is first reached: `start` for 0 or less, `end` for the length or more; a distance held at rest is reached when the hold begins.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and the held ends.
     * @evidence contracts/development/implementation.md#principled-implementation The phase holding the distance, its quadratic solved by the stable root.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the phase, invert it.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Outside the path the nearer end holds.
     * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the phases.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the phases laid once.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the profile's closure.
     */
    when: (distance: number) => number;
  }

  /**
   * The speeds a stretch of a length can end at from an entry speed under the rates: from braking all the way to accelerating all the way.
   *
   * @param speed The entry speed, metres per second.
   * @param length The stretch's length, metres.
   * @param acceleration The acceleration, metres per second squared.
   * @param deceleration The braking, metres per second squared.
   * @returns The least and greatest end speed, metres per second; the least is 0 when the stretch is long enough to stop in.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' units and the result's meaning.
   * @evidence contracts/development/implementation.md#principled-implementation v squared = v0 squared plus or minus 2 a L under constant acceleration, the braking side floored at rest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two expressions.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function reach(
    speed: number,
    length: number,
    acceleration: number,
    deceleration: number,
  ): { minimum: number; maximum: number } {
    return {
      minimum: Math.sqrt(Math.max(0, speed * speed - 2 * deceleration * length)),
      maximum: Math.sqrt(speed * speed + 2 * acceleration * length),
    };
  }
}
