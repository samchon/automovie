import {
  type IAutoMovieRandom,
  createAutoMovieRandom,
  deriveAutoMovieSeed,
} from "@automovie/engine";

import type { IAutoMovieProficiency } from "./IAutoMovieProficiency";

/**
 * A performer's skill as numbers laws read: each proficiency axis resolved
 * to [0, 1], the interpolation every family's quantities use, the seeded
 * draw streams, and the few variability laws that hold across tasks.
 *
 * A quantity is `lerp(novice, elite, smoothstep(axis))`, so skill eases in
 * and out at the ends of the scale. The novice and elite values belong to the
 * action family whose studies measured them (striking speeds and phase
 * durations to the strikes, gait speed and stride variability to locomotion,
 * movement time and scatter to reaching and grasping, reaction times to
 * defence and orienting); a family never inherits another family's numbers,
 * and a family without a located study states provisional values for capture
 * review. Only these hold across tasks and live here:
 *
 * - timing variability, Wing and Kristofferson's (1973) two-level model
 *   `sigma^2 = motor^2 + (CV T)^2` for any timed interval, with a trained
 *   CV about half an untrained one (Grondin and Killeen 2009): CV 7 % and
 *   motor SD 25 ms to CV 2.5 % and 10 ms on the `timing` axis;
 * - endpoint scatter growing with distance over time, impulse variability
 *   (Schmidt et al. 1979; Harris and Wolpert 1998), `sigma = k D / T` with
 *   k from 0.012 s to 0.004 s on the `path` axis (provisional constants);
 * - postural sway RMS, a factor of 1.6 to 1.0 on the `balance` axis (experts
 *   sway less, Perrin et al. 2002; factor provisional).
 *
 * Draws come from counter-based streams (`createAutoMovieRandom`, Philox,
 * Salmon et al. 2011) keyed by the chain seed, the performer, the action, its
 * instance and the channel, so adding or removing one action never changes
 * another's draws. Skill never raises a range of motion.
 */
export namespace HumanSkill {
  /** A resolved skill. */
  export interface ISkill {
    /** The overall value in [0, 1]. */
    p: number;

    /** Each axis's value in [0, 1]. */
    axes: Readonly<Record<IAutoMovieProficiency.Axis, number>>;

    /** The chain seed every draw starts from. */
    seed: string;
  }

  /** The named levels' values. */
  export const LEVELS: Readonly<
    Record<"novice" | "amateur" | "trained" | "elite", number>
  > = {
    novice: 0,
    amateur: 0.35,
    trained: 0.7,
    elite: 1,
  };

  /** Every axis. */
  export const AXES: readonly IAutoMovieProficiency.Axis[] = [
    "timing",
    "path",
    "balance",
    "guard",
    "power",
    "speed",
    "recovery",
    "reaction",
    "anticipation",
    "sequencing",
  ];

  /**
   * Resolve a proficiency.
   *
   * @param proficiency A level or a value, with optional axis overrides.
   * @param seed The chain seed text.
   * @returns The skill.
   */
  export function resolve(
    proficiency: IAutoMovieProficiency,
    seed: string,
  ): ISkill {
    const p: number =
      "level" in proficiency ? LEVELS[proficiency.level] : proficiency.p;
    if (!(p >= 0 && p <= 1)) throw new Error("A proficiency lies in [0, 1]");
    const axes = {} as Record<IAutoMovieProficiency.Axis, number>;
    for (const axis of AXES) {
      const value: number = proficiency.axes?.[axis] ?? p;
      if (!(value >= 0 && value <= 1))
        throw new Error(`Proficiency axis ${axis} lies in [0, 1]`);
      axes[axis] = value;
    }
    return { p, axes, seed };
  }

  /**
   * A quantity between its novice and elite values on one axis.
   *
   * @param skill The skill.
   * @param axis The axis that governs the quantity.
   * @param novice The value at 0.
   * @param elite The value at 1.
   * @returns `lerp(novice, elite, smoothstep(axis))`.
   */
  export function quantity(
    skill: ISkill,
    axis: IAutoMovieProficiency.Axis,
    novice: number,
    elite: number,
  ): number {
    const x: number = skill.axes[axis];
    const s: number = x * x * (3 - 2 * x);
    return novice + (elite - novice) * s;
  }

  /**
   * The draw stream of one channel of one action instance.
   *
   * @param skill The skill, carrying the chain seed.
   * @param subject The performer's id.
   * @param action The action's stable id (its anchor or its name).
   * @param instance Which occurrence of that id in the performer's chain.
   * @param channel The quantity drawn.
   * @returns The stream.
   */
  export function stream(
    skill: ISkill,
    subject: string,
    action: string,
    instance: number,
    channel: string,
  ): IAutoMovieRandom {
    return createAutoMovieRandom(
      deriveAutoMovieSeed(
        skill.seed,
        subject,
        action,
        String(instance),
        channel,
      ),
    );
  }

  /**
   * A standard normal draw from a stream index pair (Box-Muller transform).
   *
   * @param random The stream.
   * @param index The first of the two indices it reads.
   * @returns A draw from N(0, 1).
   */
  export function normal(random: IAutoMovieRandom, index: number): number {
    const u: number = Math.max(1e-12, random.float(index));
    const v: number = random.float(index + 1);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /**
   * Endpoint scatter of a movement, metres: impulse variability's
   * `k D / T` (Schmidt et al. 1979), k from 0.012 s (novice) to 0.004 s
   * (elite) on the `path` axis, provisional constants.
   *
   * @param skill The skill.
   * @param distance Movement distance, metres.
   * @param seconds Movement time, seconds; positive.
   * @returns The standard deviation of the endpoint, metres.
   */
  export function scatter(
    skill: ISkill,
    distance: number,
    seconds: number,
  ): number {
    return (quantity(skill, "path", 0.012, 0.004) * distance) / seconds;
  }

  /**
   * Postural sway scale on the `balance` axis: 1.6 for a novice to 1.0 for
   * an elite (Perrin et al. 2002; provisional factor).
   *
   * @param skill The skill.
   * @returns The factor on a family's sway amplitude.
   */
  export function sway(skill: ISkill): number {
    return quantity(skill, "balance", 1.6, 1);
  }

  /**
   * A duration with timing variability: `T + sigma N(0, 1)` with
   * `sigma = sqrt(motor^2 + (CV T)^2)`, Wing and Kristofferson's two-level
   * model, clamped to stay positive.
   *
   * @param skill The skill.
   * @param random The stream.
   * @param seconds The planned duration.
   * @returns The realised duration.
   */
  export function jitter(
    skill: ISkill,
    random: IAutoMovieRandom,
    seconds: number,
  ): number {
    const cv: number = quantity(skill, "timing", 0.07, 0.025);
    const motor: number = quantity(skill, "timing", 0.025, 0.01);
    const sigma: number = Math.sqrt(motor * motor + (cv * seconds) ** 2);
    return Math.max(0.5 * seconds, seconds + sigma * normal(random, 0));
  }
}
