import type {
  IAutoMovieMotionHumanDefenceOutcome,
  IAutoMovieRandom,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { StrikingSkill } from "./StrikingSkill";

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
 * does reach, since the outcome is the author's input and must not change
 * silently. An implausible reaction time is never used.
 */
export namespace DefenceOutcome {
  /**
   * Classify a margin.
   *
   * @param margin `t_hit - (t_start + T_def)`, seconds.
   * @param movement `T_def`, seconds.
   * @returns The outcome.
   */
  export function classify(
    margin: number,
    movement: number,
  ): IAutoMovieMotionHumanDefenceOutcome.Outcome {
    if (margin >= 0) return "inTime";
    if (margin > -0.5 * movement) return "late";
    return "fail";
  }

  /**
   * The margin band an outcome occupies, seconds, before plausibility.
   *
   * @param outcome The outcome.
   * @param movement `T_def`, seconds.
   * @returns `[low, high]`; open ends are infinite.
   */
  export function band(
    outcome: IAutoMovieMotionHumanDefenceOutcome.Outcome,
    movement: number,
  ): readonly [number, number] {
    if (outcome === "inTime") return [0, Infinity];
    if (outcome === "late") return [-0.5 * movement, 0];
    return [-Infinity, -0.5 * movement];
  }

  /**
   * Decide a defence: drawn from the defender's skill, or forced into a band.
   *
   * @param input The timing.
   * @param random The defender's stream for this defence.
   * @param forced The outcome to force, when the author declares one.
   * @returns The decision.
   * @throws {Error} When the contact is not after the launch, the movement time
   *   is not positive, the telegraph leaves [0, 1] or the stretch band excludes
   *   1.
   * @throws {HumanRefusal} A `parameter` refusal on `outcome` when no plausible
   *   timing inside the attack's stretch band meets the forced outcome, with
   *   the outcomes it does meet.
   */
  export function decide(
    input: IAutoMovieMotionHumanDefenceOutcome.IInput,
    random: IAutoMovieRandom,
    forced?: IAutoMovieMotionHumanDefenceOutcome.Outcome,
  ): IAutoMovieMotionHumanDefenceOutcome.IDecision {
    if (!(input.hit > input.launch))
      throw new Error("A strike's contact comes after its launch");
    if (!(input.movement > 0))
      throw new Error("A defence takes a positive time");
    if (!(input.telegraph >= 0 && input.telegraph <= 1))
      throw new Error("A telegraph lies in [0, 1]");
    const [rLow, rHigh] = StrikingSkill.reactionBand(input.skill);
    const [aLow, aHigh] = StrikingSkill.anticipation(input.skill);

    // Unforced: the reaction is the skill's draw, the lead a uniform draw in
    // its band, and the outcome is whatever the margin gives.
    if (forced === undefined) {
      const reaction: number = StrikingSkill.reaction(input.skill, random, 0);
      const lead: number = aLow + (aHigh - aLow) * random.float(3);
      const start: number = input.launch + reaction - lead * input.telegraph;
      const margin: number = input.hit - (start + input.movement);
      return {
        outcome: classify(margin, input.movement),
        start,
        reaction,
        lead,
        margin,
        stretch: 1,
        hit: input.hit,
      };
    }

    // The plausible margins: the earliest start reacts fastest with the most
    // lead, the latest reacts slowest with none.
    const earliest: number = rLow - aHigh * input.telegraph;
    const latest: number = rHigh - aLow * input.telegraph;
    const wanted: readonly [number, number] = band(forced, input.movement);
    const plausible = (factor: number): readonly [number, number] => {
      const delivery: number = (input.hit - input.launch) * factor;
      return [
        delivery - latest - input.movement,
        delivery - earliest - input.movement,
      ];
    };

    // Find the stretch nearest 1 at which the forced band meets the plausible
    // one: the plausible band moves linearly with the factor, so the meeting
    // factor is solved in closed form, reaching 2 % of the defence time
    // inside the forced band so its edge is not met only to rounding.
    const [sLow, sHigh] = input.stretch ?? [1, 1];
    if (!(sLow <= 1 && sHigh >= 1))
      throw new Error("An attack's stretch band contains 1");
    const delivery: number = input.hit - input.launch;
    const inside: number = 0.02 * input.movement;
    let factor: number = 1;
    const [p0, p1] = plausible(1);
    if (p1 < wanted[0])
      factor = Math.min(
        sHigh,
        (wanted[0] + inside + earliest + input.movement) / delivery,
      );
    else if (p0 > wanted[1])
      factor = Math.max(
        sLow,
        (wanted[1] - inside + latest + input.movement) / delivery,
      );
    const [q0, q1] = plausible(factor);
    const low: number = Math.max(q0, wanted[0]);
    const high: number = Math.min(q1, wanted[1]);

    // An outcome plausible timing cannot produce, at any stretch the attack
    // allows, is refused with the outcomes it can produce: the outcome is the
    // author's input, and a defence that lands in another band would change
    // it silently. The plausible margins over the whole stretch band run from
    // the shortest attack's latest start to the longest attack's earliest.
    if (!(low <= high)) {
      const reach: readonly [number, number] = [
        plausible(sLow)[0],
        plausible(sHigh)[1],
      ];
      const reachable: IAutoMovieMotionHumanDefenceOutcome.Outcome[] = (
        ["inTime", "late", "fail"] as const
      ).filter(
        (outcome: IAutoMovieMotionHumanDefenceOutcome.Outcome): boolean => {
          const [b0, b1] = band(outcome, input.movement);
          return Math.max(b0, reach[0]) <= Math.min(b1, reach[1]);
        },
      );
      throw new HumanRefusal({
        kind: "parameter",
        axis: "outcome",
        value: forced,
        feasible: { kind: "alternatives", values: reachable },
        reason: `a ${forced} defence needs a margin in [${wanted[0].toFixed(3)}, ${wanted[1].toFixed(3)}] s, but plausible timing gives [${q0.toFixed(3)}, ${q1.toFixed(3)}] s even at attack stretch ${factor.toFixed(3)}`,
        fix: "force one of the outcomes listed, or change what sets the timing: the attack's technique (a round kick shows most of its preparation, a lead jab least) or the defender's proficiency",
      });
    }

    // A strictly-inside draw: the late band's ends are exclusive.
    const margin: number = low + (high - low) * (0.02 + 0.96 * random.float(0));

    // Split the start into a reaction and a lead: the lead's share of its band
    // is drawn, the reaction follows, and if it leaves its band it is clamped
    // and the lead solved again (always inside its band, because the margin
    // lies inside the plausible band).
    const hit: number = input.launch + delivery * factor;
    const start: number = hit - input.movement - margin;
    const offset: number = start - input.launch;
    let lead: number = aLow + (aHigh - aLow) * random.float(1);
    let reaction: number = offset + lead * input.telegraph;
    if (reaction < rLow || reaction > rHigh) {
      reaction = Math.min(rHigh, Math.max(rLow, reaction));
      lead =
        input.telegraph > 0
          ? Math.min(
              aHigh,
              Math.max(aLow, (reaction - offset) / input.telegraph),
            )
          : aLow;
    }
    const realised: number = input.launch + reaction - lead * input.telegraph;
    const realisedMargin: number = hit - (realised + input.movement);
    return {
      outcome: classify(realisedMargin, input.movement),
      start: realised,
      reaction,
      lead,
      margin: realisedMargin,
      stretch: factor,
      hit,
    };
  }
}
