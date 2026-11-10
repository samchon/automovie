import type { IAutoMovieRandom } from "@automovie/engine";

import { HumanSkill } from "../skill/HumanSkill";

/**
 * The striking family's measured timing, speed, reaction and guard numbers,
 * from novice to elite, as `HumanSkill.quantity` reads them. They belong to
 * striking alone: no other action family reads them, and striking reads no
 * other family's numbers (only the cross-task variability laws of
 * `HumanSkill`).
 *
 * Elite phase durations are the measured means of trained populations; the
 * novice end scales them by the ratios of Vagner et al. 2023 (a systematic
 * review of the roundhouse kick, PMC10459763): the time from launch to target
 * is about equal across levels (280 to 300 ms, so the strike phase scales
 * x1.06 to x1.0), while the whole kick takes 1.06 s for novices against 0.84 s
 * for elites, which the chamber and the recovery absorb (x1.4 to x1.0).
 * Peak distal speed differs far more (6.5, 11.4 and 14.3 m/s for novice,
 * sub-elite and elite foot speed), so with near-equal time the novice covers a
 * shorter path: proficiency scales the share of the available range a strike
 * uses (its chamber and its trunk turn), never the range itself.
 *
 * Constants with no located study are marked provisional, with the
 * measurement that would settle them.
 */
export namespace StrikingSkill {
  /** Single maximal jab, movement onset to contact, seconds (Stanley, Thomson, Smith and Lamb 2018, Int J Perf Anal Sport 18:835, abstract; fifteen amateur boxers). */
  export const JAB_DELIVERY: number = 0.405;

  /** Contact-to-contact interval of alternating hands in a combination, seconds (Piorkowski, Lees and Barton 2011, Sports Biomech 10:1: 1.05 s over three intervals). */
  export const ALTERNATING_INTERVAL: number = 1.05 / 3;

  /** Contact-to-contact interval of two punches of the same hand, seconds (Piorkowski et al. 2011: 1.35 s over three intervals). */
  export const SAME_HAND_INTERVAL: number = 1.35 / 3;

  /** A punching hand's return to the guard after contact: the rest of one alternating interval, seconds (Piorkowski et al. 2011). */
  export const HAND_RECOVERY: number = ALTERNATING_INTERVAL;

  /** Muay Thai roundhouse execution, support toe-down to kicking heel-down, seconds (Gavagan and Sayers 2017, PLOS ONE 12:e0182645, eight experts). */
  export const KICK_EXECUTION: number = 1.02;

  /** Kick preparation, seconds (Gavagan and Sayers 2017). */
  export const KICK_PREPARATION: number = 0.074;

  /** Kick chamber, launch of the knee to the chamber key, seconds: 14 % of the execution (Gavagan and Sayers 2017). */
  export const KICK_CHAMBER: number = 0.14 * KICK_EXECUTION;

  /** Kick extension, chamber key to impact, seconds: 11 % of the execution (Gavagan and Sayers 2017). */
  export const KICK_EXTENSION: number = 0.11 * KICK_EXECUTION;

  /** Kick recoil, impact to the replant, seconds (Gavagan and Sayers 2017: 0.65 +- 0.17 s). */
  export const KICK_RECOIL: number = 0.65;

  /**
   * Peak foot speed of a roundhouse kick, m/s, novice and elite (Vagner et
   * al. 2023: 6.5 and 14.3 m/s). An audit reference: the law sets durations
   * and paths, and the speed it shows is checked against this band.
   */
  export const KICK_PEAK_SPEED: readonly [number, number] = [6.5, 14.3];

  /**
   * Peak fist speed of a lead straight punch, m/s, novice and elite. Elite
   * 7.16 m/s against 6.32 m/s for national-level juniors (Liu et al. 2022,
   * Front Physiol 13:1015154); untrained novices were not measured, so the
   * novice end, 0.45 of elite as for the kick, is provisional until an
   * untrained group's straight-punch speed is located. An audit reference.
   */
  export const PUNCH_PEAK_SPEED: readonly [number, number] = [
    0.45 * 7.16,
    7.16,
  ];

  /**
   * Share of peak speed left at impact: 0.55 for the roundhouse (Gavagan and
   * Sayers 2017, Table 2: 7.22 of 13.24 m/s) and 0.78 for the lead straight
   * (Liu et al. 2022: 5.56 of 7.16 m/s). A strike therefore aims through its
   * target: its minimum-jerk unit would end beyond the contact point, at the
   * share of the unit where its speed has fallen to this share of the peak.
   */
  export const IMPACT_SPEED_SHARE: Readonly<Record<"punch" | "kick", number>> =
    { punch: 0.78, kick: 0.55 };

  /**
   * Latency of an online correction of a moving hand toward a displaced
   * target, seconds: hand paths turn about 110 ms after a target jump
   * (Prablanc and Martin 1992, J Neurophysiol 67:455; Day and Lyon 2000, Exp
   * Brain Res 130:159 report 125 ms). Below this lead, a target's motion is no
   * longer seen in time to change the strike.
   */
  export const CORRECTION_LATENCY: number = 0.11;

  /**
   * Strike-phase (launch to contact) duration factor.
   *
   * @param skill The skill.
   * @returns x1.06 (novice) to x1.0 (elite) on the `speed` axis (Vagner et al. 2023).
   */
  export function strike(skill: HumanSkill.ISkill): number {
    return HumanSkill.quantity(skill, "speed", 1.06, 1);
  }

  /**
   * Chamber and recovery duration factor.
   *
   * @param skill The skill.
   * @returns x1.4 (novice) to x1.0 (elite) on the `recovery` axis (Vagner et al. 2023: 1.06 s against 0.84 s per kick).
   */
  export function recovery(skill: HumanSkill.ISkill): number {
    return HumanSkill.quantity(skill, "recovery", 1.4, 1);
  }

  /**
   * Share of the available range a strike uses: the chamber's height, the
   * trunk turn and the hip drive. Provisional 0.6 (novice) to 1.0 (elite) on
   * the `power` axis: the novice's lower peak speed over a near-equal strike
   * time (Vagner et al. 2023) implies a shorter path, but no study measured
   * the chamber amplitude itself.
   *
   * @param skill The skill.
   * @returns The share in (0, 1].
   */
  export function amplitude(skill: HumanSkill.ISkill): number {
    return HumanSkill.quantity(skill, "power", 0.6, 1);
  }

  /**
   * Proximal-to-distal onset lag, as a share of the strike phase: 0.03 for a
   * novice, whose segments start together (degrees-of-freedom freezing,
   * Vereijken et al. 1992), to 0.12 for an elite, whose trunk leads the limb
   * (Dinu and Louis 2020, Front Sports Act Living 2:598861).
   *
   * @param skill The skill.
   * @returns The lag share.
   */
  export function lag(skill: HumanSkill.ISkill): number {
    return HumanSkill.quantity(skill, "sequencing", 0.03, 0.12);
  }

  /**
   * One simple reaction time, seconds, drawn from an ex-Gaussian (a normal
   * plus an exponential): mu 335, sigma 60, tau 40 ms for a novice to 290,
   * 40, 20 ms for an elite on the `reaction` axis (Liu et al. 2018, combat
   * athletes' reaction times). The draw is clamped to its 1 to 99 % band so
   * no implausible reaction is ever used.
   *
   * @param skill The skill.
   * @param random The stream.
   * @param index The first of the three indices it reads.
   * @returns Seconds.
   */
  export function reaction(
    skill: HumanSkill.ISkill,
    random: IAutoMovieRandom,
    index: number,
  ): number {
    const r: IReaction = reactionLaw(skill);
    const exponential: number =
      -r.tau * Math.log(Math.max(1e-12, 1 - random.float(index + 2)));
    const draw: number =
      r.mu + r.sigma * HumanSkill.normal(random, index) + exponential;
    const [low, high] = reactionBand(skill);
    return Math.min(high, Math.max(low, draw));
  }

  /** The ex-Gaussian parameters of a reaction time, seconds. */
  export interface IReaction {
    /** Mean of the normal part. */
    mu: number;

    /** Standard deviation of the normal part. */
    sigma: number;

    /** Mean of the exponential part. */
    tau: number;
  }

  /**
   * The ex-Gaussian reaction law of a skill (Liu et al. 2018).
   *
   * @param skill The skill.
   * @returns Its parameters, seconds.
   */
  export function reactionLaw(skill: HumanSkill.ISkill): IReaction {
    return {
      mu: HumanSkill.quantity(skill, "reaction", 0.335, 0.29),
      sigma: HumanSkill.quantity(skill, "reaction", 0.06, 0.04),
      tau: HumanSkill.quantity(skill, "reaction", 0.04, 0.02),
    };
  }

  /**
   * The 1 % and 99 % points of a skill's reaction time, seconds: the normal
   * part's 2.326 sigma below the mean, and above it the normal's 2.326 sigma
   * plus the exponential's 99 % point (tau ln 100), a conservative bound of
   * the sum's upper tail.
   *
   * @param skill The skill.
   * @returns The plausible band.
   */
  export function reactionBand(
    skill: HumanSkill.ISkill,
  ): readonly [number, number] {
    const r: IReaction = reactionLaw(skill);
    return [
      r.mu - 2.326 * r.sigma,
      r.mu + 2.326 * r.sigma + r.tau * Math.log(100),
    ];
  }

  /**
   * The anticipation lead band, seconds: how much earlier than a pure
   * reaction a defender can start by reading the attacker's preparation.
   * Provisional 0 to 0.03 s for a novice and 0.08 to 0.15 s for an elite on
   * the `anticipation` axis, after the expert advantage of occlusion and
   * video-response studies (Mori, Ohtani and Imanaka 2002, Hum Mov Sci
   * 21:213); no study located measures the lead in live striking.
   *
   * @param skill The skill.
   * @returns Lower and upper lead, seconds.
   */
  export function anticipation(
    skill: HumanSkill.ISkill,
  ): readonly [number, number] {
    return [
      HumanSkill.quantity(skill, "anticipation", 0, 0.08),
      HumanSkill.quantity(skill, "anticipation", 0.03, 0.15),
    ];
  }

  /**
   * Movement time of a defensive limb or head displacement, seconds: 0.30 s
   * for a novice to 0.20 s for an elite on the `speed` axis. Provisional: a
   * 10 to 20 cm guard or head displacement on a minimum-jerk profile at the
   * hand speeds of guard movements, with no located study timing a block or a
   * slip from onset to completion.
   *
   * @param skill The skill.
   * @returns Seconds.
   */
  export function defence(skill: HumanSkill.ISkill): number {
    return HumanSkill.quantity(skill, "speed", 0.3, 0.2);
  }

  /** A guard drop after a strike. */
  export interface IGuardDrop {
    /** How far the non-striking or returning glove sags below its guard, metres; 0 when it does not drop. */
    depth: number;

    /** How long the drop lasts after the strike's contact, seconds. */
    seconds: number;
  }

  /**
   * Whether and how much the guard drops after a strike: probability 0.6, 8
   * to 15 cm for 0.3 to 0.6 s for a novice, to probability 0.1, at most 3 cm
   * for at most 0.15 s for an elite, on the `guard` axis. Provisional: coaches
   * name the dropped guard as the novice's error, but no study measuring its
   * rate or size was located.
   *
   * @param skill The skill.
   * @param random The stream.
   * @param index The first of the three indices it reads.
   * @returns The drop.
   */
  export function guardDrop(
    skill: HumanSkill.ISkill,
    random: IAutoMovieRandom,
    index: number,
  ): IGuardDrop {
    const probability: number = HumanSkill.quantity(skill, "guard", 0.6, 0.1);
    if (random.float(index) >= probability) return { depth: 0, seconds: 0 };
    const low: number = HumanSkill.quantity(skill, "guard", 0.08, 0.01);
    const high: number = HumanSkill.quantity(skill, "guard", 0.15, 0.03);
    const shortest: number = HumanSkill.quantity(skill, "guard", 0.3, 0.08);
    const longest: number = HumanSkill.quantity(skill, "guard", 0.6, 0.15);
    return {
      depth: low + (high - low) * random.float(index + 1),
      seconds: shortest + (longest - shortest) * random.float(index + 2),
    };
  }
}
