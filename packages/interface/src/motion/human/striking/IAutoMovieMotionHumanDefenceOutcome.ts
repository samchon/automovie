import type { IAutoMovieMotionHumanSkill } from "../skill/IAutoMovieMotionHumanSkill";

/**
 * Whether a defence is in time, late or fails against one strike, decided from
 * the two performers' timing before any geometry, and how a forced outcome is
 * realised with plausible human timing.
 *
 * The law (the campaign): the defender starts at `t_start = launch + RT - lead
 * x telegraph`, where `RT` is a simple reaction time from the defender's
 * ex-Gaussian, `lead` the anticipation the defender's skill buys and
 * `telegraph` in [0, 1] how much of the attack its preparation shows. With the
 * defence's own movement time `T_def` and the attacker's contact second
 * `t_hit`, the margin is `m = t_hit - (t_start + T_def)`:
 *
 * - `m >= 0`: in time; the defending limb or head is in place at contact.
 * - `-T_def / 2 < m < 0`: late; the strike lands through the half-made guard.
 * - Otherwise: fail; the strike lands as if undefended.
 *
 * A roundhouse reaches its target in about one simple reaction time (280 to 300
 * ms against a 290 ms elite mean), so a purely reactive defence cannot be in
 * time against a fast kick; anticipation is what makes it possible, which is
 * the evidence this law encodes.
 *
 * Forcing an outcome draws `m` from the forced band intersected with the
 * plausible band (every reaction time and lead inside its 1 to 99 % range),
 * solves `t_start`, and splits it into a reaction time and a lead, each in its
 * range. When the bands do not meet, the attacker's strike duration is
 * stretched or shortened within its own allowed factor first; if no factor
 * suffices, the forced outcome is refused with the outcomes plausible timing
 * reaches. An implausible reaction time is never used.
 */
export namespace IAutoMovieMotionHumanDefenceOutcome {
  /** The outcome classes. */
  export type Outcome = "inTime" | "late" | "fail";

  /** The timing a decision reads, all in film seconds. */
  export interface IInput {
    /** The strike's launch, film seconds. */
    launch: number;

    /** The strike's contact, film seconds; after the launch. */
    hit: number;

    /** How much of the attack its preparation shows, in [0, 1]. */
    telegraph: number;

    /** The defence's movement time, seconds; positive. */
    movement: number;

    /** The defender's skill. */
    skill: IAutoMovieMotionHumanSkill;

    /**
     * The factors the attacker's launch-to-contact time may be scaled by,
     * `[shortest, longest]`, containing 1; `[1, 1]` when the attack is already
     * fixed.
     */
    stretch?: readonly [number, number];
  }

  /** A decided defence. */
  export interface IDecision {
    /** The outcome. */
    outcome: IAutoMovieMotionHumanDefenceOutcome.Outcome;

    /** Film second the defence starts moving. */
    start: number;

    /** The reaction time used, seconds; inside its 1 to 99 % band. */
    reaction: number;

    /** The anticipation lead used, seconds; inside its band. */
    lead: number;

    /** The margin `m`, seconds. */
    margin: number;

    /**
     * The factor applied to the attacker's launch-to-contact time; 1 when
     * unchanged.
     */
    stretch: number;

    /** The contact second after the stretch. */
    hit: number;
  }
}
