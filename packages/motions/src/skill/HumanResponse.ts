import type { IAutoMovieRandom } from "@automovie/engine";

import { HUMAN_ATTRIBUTE_EFFECTS } from "../ensemble/HUMAN_ATTRIBUTE_EFFECTS";
import { HumanAttribute } from "../ensemble/HumanAttribute";
import { look } from "../everyday/look";
import { HumanSkill } from "./HumanSkill";

/**
 * How long a person takes to answer a cue it was waiting for: a spoken
 * command, a drum's signal, a gunshot. The latency a synced action is moved
 * by (`HumanChainCore.ISync.latency`), drawn per performer.
 *
 * `reaction` is a simple reaction to an acoustic signal, the orienting law's
 * ex-Gaussian (`look.reactionLaw`, `signal`, provisional constants) drawn by
 * the one ex-Gaussian draw (`HumanSkill.reaction`). When the command was
 * announced by its preparatory word, a person who anticipates is already
 * moving: the `anticipation` axis buys a lead of up to `LEAD`. Morale
 * scales the mean by `HUMAN_ATTRIBUTE_EFFECTS.morale.latency` (hesitation).
 * The result is floored at `FLOOR`. A `{ mean, spread }` draws a normal
 * delay for an act that is not a reaction, floored at 0.
 *
 * A latency varies when a person answers, never whether: an outcome such as
 * a man who does not fire is the author's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both kinds, their laws and sources, the lead, the morale effect, the floors and the outcome rule.
 * @evidence contracts/development/design.md#principled-representation A latency kind is a closed union of a reaction and a stated normal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One draw, its kind, and two constants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The reaction's parameters stay the orienting law's: no second copy.
 */
export namespace HumanResponse {
  /** What a latency is drawn as. */
  export type Latency = "reaction" | { mean: number; spread: number };

  /**
   * The shortest latency a reaction is given, seconds: a start within 0.1 s
   * of the gun counts as false in athletics because no one reacts faster
   * (World Athletics rule; the fastest valid reaction at Beijing 2008 was
   * 0.118 s, Lipps, Galecki and Ashton-Miller 2011), and `look` floors its
   * reactions there.
   */
  export const FLOOR: number = 0.1;

  /**
   * The most a warned, anticipating person's reaction is shortened by the
   * preparatory word, seconds (provisional: an elite's acoustic orienting
   * mean of 0.18 s against the 0.166 s mean fastest reaction of warned
   * sprinters, Lipps et al. 2011, gives a few hundredths; 0.05 s is
   * provisional until a drill-command study is read).
   */
  export const LEAD: number = 0.05;

  /**
   * One person's latency.
   *
   * @param skill The performer's skill.
   * @param random The stream, keyed by the performer, the synced action and `latency`.
   * @param latency The kind.
   * @param warned Whether a preparatory word announced the cue.
   * @param attributes The performer's attributes.
   * @returns Seconds after the cue.
   */
  export function latency(
    skill: HumanSkill.ISkill,
    random: IAutoMovieRandom,
    latency: Latency,
    warned: boolean,
    attributes:
      | Readonly<Partial<Record<HumanAttribute.Name, number>>>
      | undefined,
  ): number {
    if (latency !== "reaction")
      return Math.max(
        0,
        latency.mean + latency.spread * HumanSkill.normal(random, 0),
      );
    const law: { mu: number; sigma: number; tau: number } = look.reactionLaw(
      skill,
      "signal",
    );
    const hesitation: number = HumanAttribute.effect(
      HUMAN_ATTRIBUTE_EFFECTS.morale.latency,
      attributes?.morale,
      1,
    );
    const lead: number = warned
      ? HumanSkill.quantity(skill, "anticipation", 0, LEAD)
      : 0;
    return Math.max(
      FLOOR,
      HumanSkill.reaction(
        { ...law, mu: law.mu * hesitation - lead },
        random,
        0,
      ),
    );
  }
}
