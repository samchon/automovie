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
 *
 * @evidence contracts/development/common.md#meaningful-documentation p: The overall value in [0, 1]. axes: Each axis's value in [0, 1]. seed: The chain seed every draw starts from.
 * @evidence contracts/development/design.md#principled-representation p: The overall value in [0, 1]. axes: Each axis's value in [0, 1]. seed: The chain seed every draw starts from.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/look.ts (look.reaction, skill); everyday/look.ts (look.reactionLaw, skill); handling/HumanPrehension.ts (HumanPrehension.duration, skill); skill/HumanResponse.ts (HumanResponse.latency, skill); skill/HumanSkill.ts (HumanSkill.resolve, return); skill/HumanSkill.ts (HumanSkill.quantity, skill).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieProficiency.Axis identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSkill {
  /**
   * A simple reaction time to a cue, seconds: an ex-Gaussian draw (a normal plus an exponential) with skill-scaled parameters. A resolved skill.
   *
   * @evidence contracts/development/common.md#meaningful-documentation p: The overall value in [0, 1]. axes: Each axis's value in [0, 1]. seed: The chain seed every draw starts from.
   * @evidence contracts/development/design.md#principled-representation p: The overall value in [0, 1]. axes: Each axis's value in [0, 1]. seed: The chain seed every draw starts from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/look.ts (look.reaction, skill); everyday/look.ts (look.reactionLaw, skill); handling/HumanPrehension.ts (HumanPrehension.duration, skill); skill/HumanResponse.ts (HumanResponse.latency, skill); skill/HumanSkill.ts (HumanSkill.resolve, return); skill/HumanSkill.ts (HumanSkill.quantity, skill).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieProficiency.Axis identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISkill {
    /** The overall value in [0, 1]. */
    p: number;

    /** Each axis's value in [0, 1]. */
    axes: Readonly<Record<IAutoMovieProficiency.Axis, number>>;

    /** The chain seed every draw starts from. */
    seed: string;
  }

  /**
   * One simple reaction time drawn from an ex-Gaussian, the distribution simple reaction times follow (Hohle 1965): a normal of mean `mu` and standard deviation `sigma` plus an exponential of mean `tau`. The family that reacts gives the three parameters from its own studies (orienting in `look`, combat in `StrikingSkill`, a command's answer in `HumanResponse`) and its own floor or band; this is the one draw. Input law of HumanSkill.reaction. The ex-Gaussian's parameters, seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation mu: Gaussian reaction-delay mean, seconds. sigma: Gaussian reaction-delay standard deviation, seconds. tau: Exponential tail mean, seconds; added to the Gaussian delay for the ex-Gaussian reaction law.
   * @evidence contracts/development/design.md#principled-representation mu: Gaussian reaction-delay mean, seconds. sigma: Gaussian reaction-delay standard deviation, seconds. tau: Exponential tail mean, seconds; added to the Gaussian delay for the ex-Gaussian reaction law.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: skill/HumanSkill.ts (HumanSkill.reaction, law).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanSkill.reaction.
   */
  export type IReactionLaw = {
    /** Gaussian reaction-delay mean, seconds. */
    mu: number;
    /** Gaussian reaction-delay standard deviation, seconds. */
    sigma: number;
    /** Exponential tail mean, seconds; added to the Gaussian delay for the ex-Gaussian reaction law. */
    tau: number;
  };
}
