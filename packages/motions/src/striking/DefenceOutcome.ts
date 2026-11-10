import type { IAutoMovieRandom } from "@automovie/engine";

import { HumanSkill } from "../skill/HumanSkill";
import { StrikingSkill } from "./StrikingSkill";

/**
 * Whether a defence is in time, late or fails against one strike, decided
 * from the two performers' timing before any geometry, and how a forced
 * outcome is realised with plausible human timing.
 *
 * The law (campaign #3201): the defender starts at `t_start = launch + RT -
 * lead x telegraph`, where `RT` is a simple reaction time from the defender's
 * ex-Gaussian, `lead` the anticipation the defender's skill buys and
 * `telegraph` in [0, 1] how much of the attack its preparation shows. With
 * the defence's own movement time `T_def` and the attacker's contact second
 * `t_hit`, the margin is `m = t_hit - (t_start + T_def)`:
 *
 * - `m >= 0`: in time; the defending limb or head is in place at contact.
 * - `-T_def / 2 < m < 0`: late; the strike lands through the half-made guard.
 * - otherwise: fail; the strike lands as if undefended.
 *
 * A roundhouse reaches its target in about one simple reaction time (280 to
 * 300 ms against a 290 ms elite mean), so a purely reactive defence cannot be
 * in time against a fast kick; anticipation is what makes it possible, which
 * is the evidence this law encodes.
 *
 * Forcing an outcome draws `m` from the forced band intersected with the
 * plausible band (every reaction time and lead inside its 1 to 99 % range),
 * solves `t_start`, and splits it into a reaction time and a lead, each in its
 * range. When the bands do not meet, the attacker's strike duration is
 * stretched or shortened within its own allowed factor first; if no factor
 * suffices, the nearest plausible margin is used and a warning names the
 * shortfall. An implausible reaction time is never used.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the start law, the margin bands, the evidence behind anticipation and how a forced outcome is realised or reported.
 * @evidence contracts/development/design.md#principled-representation The outcome as a closed union of the three margin bands, the timing in film seconds, and a decision that carries the realised reaction, lead, stretch and warnings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The types and the classify, band and decide functions the defence law and its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the engine's random stream and the skill types.
 */
export namespace DefenceOutcome {
  /**
   * The outcome classes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The namespace defines each class's margin band.
   * @evidence contracts/development/design.md#principled-representation A closed union of the three outcomes the margin bands partition.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The outcomes the defence law forces and reports.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Outcome = "inTime" | "late" | "fail";

  /**
   * The timing a decision reads, all in film seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit, range and default.
   * @evidence contracts/development/design.md#principled-representation Film-second instants, a seconds duration, a share in [0, 1] and a factor band; the orderings and ranges are checked when deciding.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the decision reads; the stretch band lets a forced outcome scale the attack.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the skill type.
   */
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
    skill: HumanSkill.ISkill;

    /** The factors the attacker's launch-to-contact time may be scaled by, `[shortest, longest]`, containing 1; `[1, 1]` when the attack is already fixed. */
    stretch?: readonly [number, number];
  }

  /**
   * A decided defence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and band.
   * @evidence contracts/development/design.md#principled-representation The outcome with the realised start, reaction, lead and margin in seconds, the attack's stretch and contact, and the warnings of an unmet forced outcome.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the defence law schedules and what audits and tests read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the outcome union.
   */
  export interface IDecision {
    /** The outcome. */
    outcome: Outcome;

    /** Film second the defence starts moving. */
    start: number;

    /** The reaction time used, seconds; inside its 1 to 99 % band. */
    reaction: number;

    /** The anticipation lead used, seconds; inside its band. */
    lead: number;

    /** The margin `m`, seconds. */
    margin: number;

    /** The factor applied to the attacker's launch-to-contact time; 1 when unchanged. */
    stretch: number;

    /** The contact second after the stretch. */
    hit: number;

    /** Why a forced outcome could not be met with plausible timing; empty when it was. */
    warnings: string[];
  }

  /**
   * Classify a margin.
   *
   * @param margin `t_hit - (t_start + T_def)`, seconds.
   * @param movement `T_def`, seconds.
   * @returns The outcome.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and units.
   * @evidence contracts/development/implementation.md#principled-implementation The campaign's margin bands: non-negative in time, above minus half the movement time late, otherwise fail.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two comparisons.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function classify(margin: number, movement: number): Outcome {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result's form and its open ends.
   * @evidence contracts/development/implementation.md#principled-implementation The same bands as the classification, as intervals.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per outcome.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function band(
    outcome: Outcome,
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
   * @throws {Error} When the contact is not after the launch, the movement time is not positive, the telegraph leaves [0, 1] or the stretch band excludes 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two modes, the refusals and that warnings report an unmet forced outcome.
   * @evidence contracts/development/implementation.md#principled-implementation Unforced: the skill's ex-Gaussian reaction and a uniform lead give the margin. Forced: the plausible margin band, linear in the attack's stretch, is met in closed form, a margin drawn strictly inside the intersection and split into an in-band reaction and lead.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validation, the unforced draw, then the stretch, the margin and the split for a forced outcome.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid timing throws; an unmeetable forced outcome uses the nearest plausible margin and says so in a warning rather than an implausible reaction time; the 2 % inset keeps a draw off a band's exclusive edge.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs and the given stream.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function decide(
    input: IInput,
    random: IAutoMovieRandom,
    forced?: Outcome,
  ): IDecision {
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
        warnings: [],
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
    const warnings: string[] = [];
    let margin: number;
    if (low <= high) {
      // A strictly-inside draw: the late band's ends are exclusive.
      const span: number = high - low;
      margin = low + span * (0.02 + 0.96 * random.float(0));
    } else {
      margin = q1 < wanted[0] ? q1 : q0;
      warnings.push(
        `A ${forced} defence needs a margin in [${wanted[0].toFixed(3)}, ${wanted[1].toFixed(3)}] s, but plausible timing gives [${q0.toFixed(3)}, ${q1.toFixed(3)}] s even at attack stretch ${factor.toFixed(3)}; the nearest plausible margin ${margin.toFixed(3)} s is used`,
      );
    }

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
      warnings,
    };
  }
}
