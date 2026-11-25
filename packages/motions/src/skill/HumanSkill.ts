import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanSkill,
  IAutoMovieProficiency,
  IAutoMovieRandom,
  IAutoMovieReactionTimeDistribution,
} from "@automovie/interface";

/** The alternatives of `LEVELSEntryItem`'s site. */
type LEVELSEntryItem = "novice" | "amateur" | "trained" | "elite";

/**
 * A performer's skill as numbers laws read: each proficiency axis resolved to
 * [0, 1], the interpolation every family's quantities use, the seeded draw
 * streams, and the few variability laws that hold across tasks.
 *
 * A quantity is `lerp(novice, elite, smoothstep(axis))`, so skill eases in and
 * out at the ends of the scale. The novice and elite values belong to the
 * action family whose studies measured them (striking speeds and phase
 * durations to the strikes, gait speed and stride variability to locomotion,
 * movement time and scatter to reaching and grasping, reaction times to defence
 * and orienting); a family never inherits another family's numbers, and a
 * family without a located study states provisional values for capture review.
 * Only these hold across tasks and live here:
 *
 * - Timing variability, Wing and Kristofferson's (1973) two-level model `sigma^2
 *   = motor^2 + (CV T)^2` for any timed interval, with a trained CV about half
 *   an untrained one (Grondin and Killeen 2009): CV 7 % and motor SD 25 ms to
 *   CV 2.5 % and 10 ms on the `timing` axis;
 * - Endpoint scatter growing with distance over time, impulse variability
 *   (Schmidt et al. 1979; Harris and Wolpert 1998), `sigma = k D / T` with k
 *   from 0.012 s to 0.004 s on the `path` axis (provisional constants);
 * - Postural sway RMS, a factor of 1.6 to 1.0 on the `balance` axis (experts sway
 *   less, Perrin et al. 2002; factor provisional).
 *
 * Draws come from counter-based streams (`createAutoMovieRandom`, Philox,
 * Salmon et al. 2011) keyed by the chain seed, the performer, the action, its
 * instance and the channel, so adding or removing one action never changes
 * another's draws. Skill never raises a range of motion.
 */
export namespace HumanSkill {
  /**
   * The named levels' values: the scale is Fitts and Posner's (1967, Human
   * Performance) three stages of skill learning, cognitive, associative and
   * autonomous, laid end to end. A novice begins the cognitive stage (0), an
   * amateur has reached the associative stage, a trained performer the
   * autonomous one, and an elite performer has completed it (1). The stages are
   * ordinal: no study measures their spans on one scale (practice hours do not,
   * since the best and the good violinists of Ericsson, Krampe and Tesch-Römer
   * 1993 did not differ in accumulated practice on Macnamara and Maitra's 2019
   * replication), so each stage takes an equal third and the two inner levels
   * sit at its boundaries.
   */
  export const LEVELS: Readonly<Record<LEVELSEntryItem, number>> = {
    novice: 0,
    amateur: 1 / 3,
    trained: 2 / 3,
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
  ): IAutoMovieMotionHumanSkill {
    const p: number =
      "level" in proficiency ? LEVELS[proficiency.level] : proficiency.p;
    if (!(p >= 0 && p <= 1)) throw new Error("A proficiency lies in [0, 1]");
    const axes: Record<IAutoMovieProficiency.Axis, number> = {
      timing: p,
      path: p,
      balance: p,
      guard: p,
      power: p,
      speed: p,
      recovery: p,
      reaction: p,
      anticipation: p,
      sequencing: p,
    };
    for (const axis of AXES) {
      const value: number | undefined = proficiency.axes?.[axis];
      if (value === undefined) continue;
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
    skill: IAutoMovieMotionHumanSkill,
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
    skill: IAutoMovieMotionHumanSkill,
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
   * The draw stream one channel shares across every instance of an action, for
   * a sequence indexed by the instance.
   *
   * @param skill The skill, carrying the chain seed.
   * @param subject The performer's id.
   * @param action The action's stable id (its anchor or its name).
   * @param channel The quantity drawn.
   * @returns The stream.
   */
  export function series(
    skill: IAutoMovieMotionHumanSkill,
    subject: string,
    action: string,
    channel: string,
  ): IAutoMovieRandom {
    return createAutoMovieRandom(
      deriveAutoMovieSeed(skill.seed, subject, action, "series", channel),
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
   * One simple reaction time drawn from an ex-Gaussian, the distribution simple
   * reaction times follow (Hohle 1965): a normal of mean `mu` and standard
   * deviation `sigma` plus an exponential of mean `tau`. The family that reacts
   * gives the three parameters from its own studies (orienting in `look`,
   * combat in `StrikingSkill`, a command's answer in `HumanResponse`) and its
   * own floor or band; this is the one draw.
   *
   * @param law The ex-Gaussian's parameters, seconds.
   * @param random The stream; reads indices `index`, `index + 1` (the normal)
   *   and `index + 2` (the exponential).
   * @param index The first index read; 0 when absent.
   * @returns Seconds, unfloored.
   */
  export function reaction(
    law: IAutoMovieReactionTimeDistribution,
    random: IAutoMovieRandom,
    index: number = 0,
  ): number {
    const exponential: number =
      -law.tau * Math.log(Math.max(1e-12, 1 - random.float(index + 2)));
    return law.mu + law.sigma * normal(random, index) + exponential;
  }

  /**
   * Endpoint scatter of a movement, metres: impulse variability's `k D / T`
   * (Schmidt et al. 1979), k from 0.012 s (novice) to 0.004 s (elite) on the
   * `path` axis, provisional constants.
   *
   * @param skill The skill.
   * @param distance Movement distance, metres.
   * @param seconds Movement time, seconds; positive.
   * @returns The standard deviation of the endpoint, metres.
   */
  export function scatter(
    skill: IAutoMovieMotionHumanSkill,
    distance: number,
    seconds: number,
  ): number {
    return (quantity(skill, "path", 0.012, 0.004) * distance) / seconds;
  }

  /**
   * Postural sway scale on the `balance` axis: 1.6 for a novice to 1.0 for an
   * elite (Perrin et al. 2002; provisional factor).
   *
   * @param skill The skill.
   * @returns The factor on a family's sway amplitude.
   */
  export function sway(skill: IAutoMovieMotionHumanSkill): number {
    return quantity(skill, "balance", 1.6, 1);
  }

  /**
   * A duration with timing variability: a log-normal draw whose mean is the
   * planned `T` and whose standard deviation is Wing and Kristofferson's
   * two-level `sigma = sqrt(motor^2 + (CV T)^2)`. A duration is positive and
   * its spread grows with its length (the scalar property of timing, Gibbon
   * 1977, Psychological Review 84:279), so its distribution is the log-normal,
   * the one of a positive quantity with multiplicative noise, rather than a
   * normal whose tail crosses zero: with `s^2 = ln(1 + sigma^2 / T^2)` and `m =
   * ln T - s^2 / 2`, the draw is `exp(m + s N(0, 1))`, which has the two-level
   * model's mean and variance exactly and needs no floor.
   *
   * @param skill The skill.
   * @param random The stream.
   * @param seconds The planned duration.
   * @returns The realised duration, positive for a positive plan; a plan of no
   *   time is returned as given.
   */
  export function jitter(
    skill: IAutoMovieMotionHumanSkill,
    random: IAutoMovieRandom,
    seconds: number,
  ): number {
    const cv: number = quantity(skill, "timing", 0.07, 0.025);
    const motor: number = quantity(skill, "timing", 0.025, 0.01);
    if (!(seconds > 0)) return seconds;
    const sigma: number = Math.sqrt(motor * motor + (cv * seconds) ** 2);
    const spread: number = Math.log(1 + (sigma * sigma) / (seconds * seconds));
    return Math.exp(
      Math.log(seconds) - spread / 2 + Math.sqrt(spread) * normal(random, 0),
    );
  }
}
